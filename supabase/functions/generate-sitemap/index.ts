import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DOMAIN = "https://netpowerit.co";

const CATEGORY_SLUGS: Record<string, string> = {
  "Baterías Para UPS": "baterias-ups",
  "UPS y Accesorios": "ups-accesorios",
  "Infraestructura TIC": "infraestructura-tic",
  "Energía Solar": "energia-solar",
  "Servidores": "servidores",
  "Licencias": "licencias",
  "Monitores": "monitores",
  "Accesorios": "accesorios",
};

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function toW3C(date: string | null) {
  try {
    return date ? new Date(date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: products } = await supabase
    .from("products")
    .select("slug, updated_at, category")
    .eq("active", true)
    .order("updated_at", { ascending: false });

  const today = new Date().toISOString().split("T")[0];

  // Static pages
  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily", lastmod: today },
    { loc: "/tienda", priority: "0.9", changefreq: "daily", lastmod: today },
    { loc: "/cotizacion", priority: "0.7", changefreq: "monthly", lastmod: today },
    { loc: "/contacto", priority: "0.6", changefreq: "monthly", lastmod: today },
    { loc: "/marcas", priority: "0.6", changefreq: "monthly", lastmod: today },
    { loc: "/nosotros", priority: "0.5", changefreq: "monthly", lastmod: today },
    { loc: "/legal", priority: "0.3", changefreq: "yearly", lastmod: today },
  ];

  // Category pages
  const categoryEntries = Object.entries(CATEGORY_SLUGS).map(([, slug]) => ({
    loc: `/tienda?categoria=${slug}`,
    priority: "0.8",
    changefreq: "weekly",
    lastmod: today,
  }));

  // Product pages
  const productEntries = (products ?? []).map((p) => ({
    loc: `/producto/${escapeXml(p.slug)}`,
    priority: "0.7",
    changefreq: "monthly",
    lastmod: toW3C(p.updated_at),
  }));

  const allEntries = [...staticPages, ...categoryEntries, ...productEntries];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
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
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
