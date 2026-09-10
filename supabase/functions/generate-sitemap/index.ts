// Sitemap dinamico de netpowerit.co.
//
// Cambios respecto a la version anterior:
//  - Se dejan fuera los productos sin imagen y sin precio. Son 467 de 867 fichas
//    activas: no tienen nada que ensenar, y declararlas gasta presupuesto de
//    rastreo en paginas que Google ya venia descartando como «Rastreada:
//    actualmente sin indexar». Siguen navegables en el sitio; solo dejan de
//    anunciarse.
//  - Se quita `/legal`, que `robots.txt` bloquea con `Disallow`. Declarar en el
//    sitemap una URL bloqueada es una contradiccion que Search Console reporta.
//  - Se anade `/politica-datos`, que existe, es obligatoria por la Ley 1581 y no
//    estaba en ningun sitemap.
//
// El sitemap estatico `public/sitemap.xml` ya no lista URLs: es un indice que
// apunta a este. Este archivo es la unica fuente de verdad.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DOMAIN = "https://netpowerit.co";

const CATEGORY_SLUGS: Record<string, string> = {
  "Baterías Para UPS": "baterias-ups",
  "UPS y Accesorios": "ups",
  "Infraestructura TIC": "infraestructura-tic",
  "Energía Solar": "energia-solar",
  Servidores: "servidores",
  Licencias: "licencias",
  Monitores: "monitores",
  Accesorios: "accesorios",
};

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toW3C(date: string | null) {
  try {
    return date
      ? new Date(date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

/** Una ficha merece anunciarse si tiene algo que mostrar: imagen o precio. */
function vale(p: { price: number | null; images: string[] | null }): boolean {
  const tienePrecio = Number(p.price ?? 0) > 0;
  const tieneImagen = Array.isArray(p.images) && typeof p.images[0] === "string" && p.images[0].trim() !== "";
  return tienePrecio || tieneImagen;
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: products } = await supabase
    .from("products")
    .select("slug, updated_at, price, images")
    .eq("active", true)
    .order("updated_at", { ascending: false });

  const today = new Date().toISOString().split("T")[0];

  // `/legal` no entra: robots.txt lo bloquea.
  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily", lastmod: today },
    { loc: "/tienda", priority: "0.9", changefreq: "daily", lastmod: today },
    { loc: "/cotizacion", priority: "0.9", changefreq: "monthly", lastmod: today },
    { loc: "/blog", priority: "0.8", changefreq: "weekly", lastmod: today },
    { loc: "/marcas", priority: "0.8", changefreq: "monthly", lastmod: today },
    { loc: "/contacto", priority: "0.7", changefreq: "monthly", lastmod: today },
    { loc: "/nosotros", priority: "0.7", changefreq: "monthly", lastmod: today },
    { loc: "/politica-datos", priority: "0.3", changefreq: "yearly", lastmod: today },
  ];

  const categoryEntries = Object.entries(CATEGORY_SLUGS).map(([, slug]) => ({
    loc: `/categoria/${slug}`,
    priority: "0.9",
    changefreq: "weekly",
    lastmod: today,
  }));

  const todos = products ?? [];
  const publicables = todos.filter(vale);
  const omitidos = todos.length - publicables.length;

  const productEntries = publicables.map((p) => ({
    loc: `/producto/${escapeXml(p.slug)}`,
    priority: Number(p.price ?? 0) > 0 ? "0.8" : "0.6",
    changefreq: "monthly",
    lastmod: toW3C(p.updated_at),
  }));

  const allEntries = [...staticPages, ...categoryEntries, ...productEntries];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${allEntries.length} URLs. Fichas activas omitidas por no tener ni imagen ni precio: ${omitidos} -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries
  .map(
    (e) => `  <url>
    <loc>${DOMAIN}${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
