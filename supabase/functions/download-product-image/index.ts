import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl, fileName } = await req.json();
    if (!imageUrl) throw new Error("imageUrl is required");

    // Download the external image
    const imgResp = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!imgResp.ok) throw new Error(`Failed to fetch image: ${imgResp.status}`);

    const contentType = imgResp.headers.get("content-type") || "image/jpeg";
    const blob = await imgResp.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    // Determine extension
    const extMap: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
    };
    const ext = extMap[contentType] || ".jpg";
    const safeName = (fileName || `product-${Date.now()}`).replace(/[^a-z0-9-_]/gi, "-") + ext;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(safeName, uint8, {
        contentType,
        upsert: true,
      });

    if (error) throw new Error(`Storage upload failed: ${error.message}`);

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(safeName);

    return new Response(
      JSON.stringify({ url: urlData.publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("download-product-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
