// Feed de productos para Google Merchant Center.
//
// Que cambio y por que:
//  - `g:brand` no se emitia. La marca SI esta en la base (298 de 326 referencias
//    activas con precio la tienen), asi que Google no podia reconocer un
//    producto como Forza, SAT o APC pese a tener el dato.
//  - `g:condition` sale de la columna `condition`, traducida al enum de Google.
//  - `g:mpn` solo cuando hay un numero de parte real. Los SKU autogenerados por
//    el generador de fichas (`SKU-1788...`) no son numeros de parte y meterlos
//    como tales es informacion incorrecta.
//  - `g:identifier_exists` en "no" cuando no hay ni GTIN ni MPN. Es lo que Google
//    exige declarar; sin eso rechaza el articulo por identificadores ausentes.
//  - `g:product_type` con nuestra propia taxonomia (texto libre, no validado).
//  - `google_product_category` NO se emite: es opcional y Google clasifica solo.
//    Solo debe ponerse con IDs verificados contra la taxonomia oficial
//    (https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt).
//    Un valor inventado hace que Google rechace el articulo.
//  - Se omiten los articulos sin imagen: Google los rechaza siempre, y dejarlos
//    solo ensucia el diagnostico de la cuenta.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DOMAIN = "https://netpowerit.co";

/** La columna `category` guarda unas veces el nombre y otras el id numerico. */
const CATEGORIA_POR_ID: Record<string, string> = {
  "1": "Baterías Para UPS",
  "2": "UPS y Accesorios",
  "3": "Infraestructura TIC",
  "4": "Energía Solar",
  "5": "Servidores",
  "6": "Licencias",
  "7": "Monitores",
  "8": "Accesorios",
};

/** `condition` viene en español; Google solo acepta new / refurbished / used. */
const CONDICION_GOOGLE: Record<string, string> = {
  nuevo: "new",
  new: "new",
  reacondicionado: "refurbished",
  remanufacturado: "refurbished",
  refurbished: "refurbished",
  usado: "used",
  used: "used",
};

function escapeXml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const limpio = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** Etiqueta solo si hay valor. Un `<g:brand></g:brand>` vacio es peor que nada. */
const etiqueta = (nombre: string, valor: unknown): string => {
  const v = limpio(valor);
  return v ? `\n      <${nombre}>${escapeXml(v)}</${nombre}>` : "";
};

function nombreCategoria(bruto: unknown): string {
  const v = limpio(bruto);
  return CATEGORIA_POR_ID[v] ?? v;
}

/**
 * Numero de parte del fabricante. Los SKU que genera la app tienen la forma
 * `SKU-<timestamp>`: son identificadores internos, no numeros de parte.
 */
function mpnReal(sku: unknown, specs: Record<string, unknown> | null): string {
  const s = limpio(sku);
  if (s && !/^SKU-\d+$/i.test(s)) return s;
  if (specs) {
    for (const clave of ["mpn", "MPN", "parte", "Parte", "numero_parte", "Referencia", "referencia"]) {
      const v = limpio((specs as Record<string, unknown>)[clave]);
      if (v) return v;
    }
  }
  return "";
}

function gtinReal(specs: Record<string, unknown> | null): string {
  if (!specs) return "";
  for (const clave of ["gtin", "GTIN", "ean", "EAN", "upc", "UPC"]) {
    const v = limpio((specs as Record<string, unknown>)[clave]).replace(/\s|-/g, "");
    if (/^\d{8}$|^\d{12,14}$/.test(v)) return v;
  }
  return "";
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id, sku, name, short_description, description, price, sale_price, images, stock, slug, brand, category, condition, specs",
    )
    .eq("active", true)
    .gt("price", 0);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let omitidosSinImagen = 0;

  const items = (products ?? [])
    .map((p) => {
      const imageUrl = Array.isArray(p.images) ? limpio(p.images[0]) : "";
      if (!imageUrl) {
        omitidosSinImagen++;
        return "";
      }

      const specs = (p.specs ?? null) as Record<string, unknown> | null;
      const gtin = gtinReal(specs);
      const mpn = mpnReal(p.sku, specs);
      const marca = limpio(p.brand);
      const disponible = (p.stock ?? 0) > 0;

      // Google exige gtin, o bien marca + mpn. Si no hay ninguno de los dos,
      // hay que declararlo explicitamente.
      const tieneIdentificador = Boolean(gtin || (marca && mpn));

      const precioLista = Number(p.price);
      const precioOferta =
        p.sale_price != null && Number(p.sale_price) > 0 && Number(p.sale_price) < precioLista
          ? Number(p.sale_price)
          : null;

      const condicion = CONDICION_GOOGLE[limpio(p.condition).toLowerCase()] ?? "new";
      const categoria = nombreCategoria(p.category);
      const descripcion = limpio(p.short_description) || limpio(p.description).slice(0, 500);

      return `
    <item>
      <g:id>${escapeXml(limpio(p.sku) || p.id)}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${escapeXml(descripcion)}</g:description>
      <g:link>${DOMAIN}/producto/${escapeXml(p.slug)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      <g:availability>${disponible ? "in_stock" : "out_of_stock"}</g:availability>
      <g:price>${precioLista.toFixed(2)} COP</g:price>${
        precioOferta !== null ? `\n      <g:sale_price>${precioOferta.toFixed(2)} COP</g:sale_price>` : ""
      }
      <g:condition>${condicion}</g:condition>${etiqueta("g:brand", marca)}${etiqueta("g:gtin", gtin)}${etiqueta("g:mpn", mpn)}
      <g:identifier_exists>${tieneIdentificador ? "yes" : "no"}</g:identifier_exists>${
        categoria ? etiqueta("g:product_type", `Tecnología TIC > ${categoria}`) : ""
      }
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Netpower IT - Product Feed</title>
    <link>${DOMAIN}</link>
    <description>Feed de productos para Google Merchant Center</description>
    <!-- articulos omitidos por no tener imagen: ${omitidosSinImagen} -->
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
