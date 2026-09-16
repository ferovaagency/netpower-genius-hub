// Sincronizacion de inventario: hoja maestra de Google -> tabla products.
//
// Cruza por SKU, que es la llave que Mafe asigno a mano en la hoja. No por
// nombre: el nombre cambia y el cruce difuso se equivoca.
//
// Lo que escribe:
//   - en los que ya existen: stock y precio, nada mas
//   - los SKU de la hoja que no existen en la web se CREAN, con nombre, slug,
//     sku, stock y precio. Crear por SKU es seguro: un SKU que no esta en la
//     base es un producto nuevo, no un duplicado. Por nombre no lo seria.
//
// Los productos nuevos nacen DESACTIVADOS salvo que se pida lo contrario
// (crearActivos: true). Una ficha con solo nombre y precio, sin foto ni
// descripcion, es contenido pobre: se publica despues de pasarla por el
// generador de fichas.
//
// Lo que NO hace, a proposito:
//   - no desactiva ni pone en stock 0 lo que no aparezca en la hoja: se reporta
//     y ya. Si la hoja se desincroniza, apagar el catalogo solo seria peor que
//     el problema que resuelve.
//   - no toca descripcion, imagenes, marca, categoria ni el estado activo de
//     los productos que ya existian.
//
// Se llama con el JWT de un admin (boton "Sincronizar ahora") o con la
// service-role key. verify_jwt = false en config.toml porque la validacion se
// hace aqui abajo.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHEET_ID = Deno.env.get('INVENTORY_SHEET_ID') || '1ZdxKYz_giUiUzlok8nMmFWEfnjJ_RNhlVy088hR633o';
const SHEET_TAB = Deno.env.get('INVENTORY_SHEET_TAB') || 'Inventario';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

/** CSV con comillas, comas dentro de campo y saltos de linea escapados. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** "1.234.000", "$ 58.800", "58800" -> numero. Null si no hay nada que leer. */
function aNumero(v: string): number | null {
  const s = String(v ?? '').trim().replace(/[$\s]/g, '');
  if (!s) return null;
  let n = s;
  const coma = s.includes(','), punto = s.includes('.');
  if (coma && punto) n = s.replace(/\./g, '').replace(',', '.');
  else if (coma) n = s.replace(',', '.');
  else if (punto && /\.\d{3}\b/.test(s)) n = s.replace(/\./g, ''); // 1.234.000 son miles
  const x = parseFloat(n);
  return Number.isFinite(x) ? x : null;
}

interface FilaHoja { sku: string; nombre: string; stock: number | null; precio: number | null }

/** Slug al mismo estilo que el resto del catalogo: sin tildes, hasta 30 caracteres. */
function aSlug(nombre: string): string {
  return (nombre || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 30).replace(/-+$/, '') || 'producto';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // ── quien llama ──────────────────────────────────────────────
    const bearer = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim();
    let autorizado = !!bearer && bearer === SERVICE_KEY;
    if (!autorizado && bearer) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${bearer}` } },
      });
      const { data: u } = await userClient.auth.getUser();
      if (u?.user) {
        const { data: esAdmin } = await admin.rpc('has_role', { _user_id: u.user.id, _role: 'admin' });
        autorizado = !!esAdmin;
      }
    }
    if (!autorizado) return json({ error: 'No autorizado' }, 401);

    const cuerpo = await req.json().catch(() => ({} as Record<string, unknown>));
    const simulacion = cuerpo?.simulacion === true;        // dry run: calcula y no escribe
    const crearActivos = cuerpo?.crearActivos === true;    // publicar los nuevos de una

    // ── leer la hoja ─────────────────────────────────────────────
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq` +
      `?tqx=out:csv&sheet=${encodeURIComponent(SHEET_TAB)}`;
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) {
      return json({ error: `No se pudo leer la hoja (HTTP ${res.status}). ¿Está compartida como "cualquiera con el enlace puede ver"?` }, 502);
    }
    const texto = await res.text();
    if (texto.trimStart().startsWith('<')) {
      return json({ error: `La pestaña "${SHEET_TAB}" no existe en la hoja.` }, 404);
    }

    const grid = parseCsv(texto).filter((r) => r.some((c) => c.trim() !== ''));
    if (grid.length < 2) return json({ error: 'La hoja está vacía.' }, 400);

    const enc = grid[0].map((h) => h.trim().toLowerCase());
    const col = (re: RegExp) => enc.findIndex((h) => re.test(h));
    const iSku = col(/^sku$/);
    const iNombre = col(/nombre|descripcion|descripción|producto/);
    const iStock = col(/stock|cantidad|existencia|disponible/);
    const iPrecio = col(/precio/);
    if (iSku < 0) return json({ error: 'La hoja no tiene una columna llamada SKU.' }, 400);

    const hoja: FilaHoja[] = [];
    const skuRepetidoEnHoja: string[] = [];
    const vistos = new Set<string>();
    for (let r = 1; r < grid.length; r++) {
      const sku = (grid[r][iSku] || '').trim();
      if (!sku) continue;
      if (vistos.has(sku)) { if (skuRepetidoEnHoja.length < 20) skuRepetidoEnHoja.push(sku); continue; }
      vistos.add(sku);
      hoja.push({
        sku,
        nombre: iNombre >= 0 ? (grid[r][iNombre] || '').trim() : '',
        stock: iStock >= 0 ? aNumero(grid[r][iStock]) : null,
        precio: iPrecio >= 0 ? aNumero(grid[r][iPrecio]) : null,
      });
    }

    // ── catálogo ─────────────────────────────────────────────────
    const { data: productos, error: eProd } = await admin
      .from('products')
      .select('id, name, slug, sku, stock, price, active')
      .range(0, 9999);
    if (eProd) return json({ error: eProd.message }, 500);

    const porSku = new Map<string, any>();
    for (const p of productos!) {
      const s = String(p.sku ?? '').trim();
      if (s) porSku.set(s, p);
    }

    // ── qué cambia ───────────────────────────────────────────────
    const cambios: { id: string; patch: Record<string, number> }[] = [];
    const detalle: any[] = [];
    const nuevos: any[] = [];
    const sinNombre: string[] = [];
    let sinCambio = 0;
    const usados = new Set<string>();

    // slugs ya tomados, para no chocar con uno existente
    const slugsUsados = new Set<string>(productos!.map((p: any) => String(p.slug)));

    for (const f of hoja) {
      const p = porSku.get(f.sku);
      if (!p) {
        // SKU que no esta en la base: producto nuevo
        if (!f.nombre) { if (sinNombre.length < 50) sinNombre.push(f.sku); continue; }
        let slug = aSlug(f.nombre);
        let n = 2;
        while (slugsUsados.has(slug)) slug = `${aSlug(f.nombre)}-${n++}`;
        slugsUsados.add(slug);
        nuevos.push({
          name: f.nombre,
          slug,
          sku: f.sku,
          stock: f.stock !== null ? Math.max(0, Math.round(f.stock)) : 0,
          price: f.precio !== null ? Math.max(0, Math.round(f.precio)) : 0,
          active: crearActivos,
        });
        continue;
      }
      usados.add(f.sku);

      const patch: Record<string, number> = {};
      const stockActual = Number(p.stock ?? 0);
      const precioActual = Number(p.price ?? 0);

      if (f.stock !== null && Math.round(f.stock) !== stockActual) patch.stock = Math.max(0, Math.round(f.stock));
      if (f.precio !== null && Math.round(f.precio) !== Math.round(precioActual)) patch.price = Math.max(0, Math.round(f.precio));

      if (!Object.keys(patch).length) { sinCambio++; continue; }
      cambios.push({ id: p.id, patch });
      if (detalle.length < 200) {
        detalle.push({
          sku: f.sku,
          nombre: p.name,
          stock: patch.stock !== undefined ? { antes: stockActual, despues: patch.stock } : null,
          precio: patch.price !== undefined ? { antes: Math.round(precioActual), despues: patch.price } : null,
        });
      }
    }

    // en la web con SKU pero sin fila en la hoja: solo se informa
    const sinFilaEnLaHoja = productos!
      .filter((p) => p.active && String(p.sku ?? '').trim() && !usados.has(String(p.sku).trim()))
      .map((p) => ({ sku: p.sku, nombre: p.name }))
      .slice(0, 100);

    const resumen = {
      filasHoja: hoja.length,
      productosConSku: porSku.size,
      actualizados: cambios.length,
      sinCambio,
      creados: nuevos.length,
      sinNombreEnLaHoja: sinNombre.length,
      productosSinFilaEnLaHoja: sinFilaEnLaHoja.length,
      skuRepetidoEnHoja: skuRepetidoEnHoja.length,
      nuevosQuedanPublicados: crearActivos,
    };

    if (simulacion) {
      return json({ ok: true, simulacion: true, resumen, detalle, nuevos: nuevos.slice(0, 200), sinNombre, sinFilaEnLaHoja, skuRepetidoEnHoja });
    }

    // ── escribir ─────────────────────────────────────────────────
    const errores: string[] = [];
    for (let i = 0; i < cambios.length; i += 25) {
      const lote = cambios.slice(i, i + 25);
      const res = await Promise.all(
        lote.map((c) => admin.from('products').update({ ...c.patch, updated_at: new Date().toISOString() }).eq('id', c.id)),
      );
      for (const r of res) if (r.error && errores.length < 10) errores.push(r.error.message);
    }

    let creados = 0;
    for (let i = 0; i < nuevos.length; i += 200) {
      const { data, error } = await admin.from('products').insert(nuevos.slice(i, i + 200)).select('id');
      if (error) { if (errores.length < 10) errores.push(`crear: ${error.message}`); }
      else creados += data?.length ?? 0;
    }
    resumen.creados = creados;

    await admin.from('sync_inventario_log').insert({
      filas_hoja: resumen.filasHoja,
      actualizados: resumen.actualizados - errores.length,
      sin_cambio: resumen.sinCambio,
      creados: resumen.creados,
      sin_fila_en_hoja: resumen.productosSinFilaEnLaHoja,
      errores: errores.length,
      detalle: { resumen, nuevos: nuevos.slice(0, 200), sinNombre, sinFilaEnLaHoja, skuRepetidoEnHoja, errores },
    });

    return json({ ok: true, resumen, detalle, nuevos: nuevos.slice(0, 200), sinNombre, sinFilaEnLaHoja, skuRepetidoEnHoja, errores });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
