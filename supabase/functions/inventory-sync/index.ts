// Sincronizacion de inventario: hoja maestra de Google -> tabla products.
//
// Cruza por SKU, que es la llave que Mafe asigno a mano en la hoja. No por
// nombre: el nombre cambia y el cruce difuso se equivoca.
//
// Lo que escribe: stock y precio. Nada mas.
// Lo que NO hace, a proposito:
//   - no crea productos que esten en la hoja y no en la web (se crean a mano
//     desde el generador de fichas, para no duplicar URLs ya indexadas)
//   - no desactiva ni pone en stock 0 lo que no aparezca en la hoja: se reporta
//     y ya. Si la hoja se desincroniza, apagar el catalogo solo seria peor que
//     el problema que resuelve.
//   - no toca descripcion, imagenes, marca, categoria ni el estado activo.
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

interface FilaHoja { sku: string; stock: number | null; precio: number | null }

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
    const simulacion = cuerpo?.simulacion === true; // dry run: calcula y no escribe

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
        stock: iStock >= 0 ? aNumero(grid[r][iStock]) : null,
        precio: iPrecio >= 0 ? aNumero(grid[r][iPrecio]) : null,
      });
    }

    // ── catálogo ─────────────────────────────────────────────────
    const { data: productos, error: eProd } = await admin
      .from('products')
      .select('id, name, sku, stock, price, active')
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
    const skuNoEncontrado: string[] = [];
    let sinCambio = 0;
    const usados = new Set<string>();

    for (const f of hoja) {
      const p = porSku.get(f.sku);
      if (!p) { if (skuNoEncontrado.length < 100) skuNoEncontrado.push(f.sku); continue; }
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
      skuDeLaHojaSinProducto: skuNoEncontrado.length,
      productosSinFilaEnLaHoja: sinFilaEnLaHoja.length,
      skuRepetidoEnHoja: skuRepetidoEnHoja.length,
    };

    if (simulacion) {
      return json({ ok: true, simulacion: true, resumen, detalle, skuNoEncontrado, sinFilaEnLaHoja, skuRepetidoEnHoja });
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

    await admin.from('sync_inventario_log').insert({
      filas_hoja: resumen.filasHoja,
      actualizados: resumen.actualizados - errores.length,
      sin_cambio: resumen.sinCambio,
      sku_sin_producto: resumen.skuDeLaHojaSinProducto,
      sin_fila_en_hoja: resumen.productosSinFilaEnLaHoja,
      errores: errores.length,
      detalle: { resumen, skuNoEncontrado, sinFilaEnLaHoja, skuRepetidoEnHoja, errores },
    });

    return json({ ok: true, resumen, detalle, skuNoEncontrado, sinFilaEnLaHoja, skuRepetidoEnHoja, errores });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
