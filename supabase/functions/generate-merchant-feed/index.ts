import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DOMAIN = "https://netpowerit.co";

function escapeXml(s: string | null): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: products, error } = await supabase
    .from("products")
    .select("id, sku, name, short_description, price, images, stock, slug")
    .eq("active", true)
    .gt("price", 0);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const items = (products ?? []).map((p) => {
    const imageUrl = p.images && p.images.length > 0 ? p.images[0] : "";
    const availability = (p.stock ?? 0) > 0 ? "in_stock" : "out_of_stock";
    const id = p.sku || p.id;
    const price = `${p.price.toFixed(2)} COP`;

    return `
    <item>
      <g:id>${escapeXml(id)}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${escapeXml(p.short_description || "")}</g:description>
      <g:link>${DOMAIN}/producto/${escapeXml(p.slug)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      <g:condition>new</g:condition>
    </item>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Netpower IT - Product Feed</title>
    <link>${DOMAIN}</link>
    <description>Feed de productos para Google Merchant Center</description>
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
