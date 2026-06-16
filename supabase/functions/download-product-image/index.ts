import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/require-admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Block private/loopback/link-local/multicast IP ranges to prevent SSRF.
function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal")) return true;
  // IPv6 loopback / link-local
  if (h === "::1" || h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
  // IPv4 dotted-quad checks
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)];
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local incl. cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a >= 224) return true; // multicast / reserved
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const denied = await requireAdmin(req, corsHeaders);
  if (denied) return denied;

  try {
    const { imageUrl, fileName } = await req.json();
    if (!imageUrl || typeof imageUrl !== "string") throw new Error("imageUrl is required");

    let parsed: URL;
    try {
      parsed = new URL(imageUrl);
    } catch {
      throw new Error("Invalid imageUrl");
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Only http(s) URLs are allowed");
    }
    if (isPrivateHost(parsed.hostname)) {
      throw new Error("URL host is not allowed");
    }

    // Download the external image
    const browserHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
      "Referer": `${parsed.protocol}//${parsed.hostname}/`,
    };
    let imgResp = await fetch(parsed.toString(), {
      headers: browserHeaders,
      redirect: "follow",
    });
    if (!imgResp.ok) {
      // Retry once without Referer (some CDNs block cross-origin referers)
      const { Referer: _r, ...noRef } = browserHeaders;
      imgResp = await fetch(parsed.toString(), { headers: noRef, redirect: "follow" });
    }
    if (!imgResp.ok) {
      // Final fallback: proxy via images.weserv.nl (bypasses hotlink protection)
      const proxied = `https://images.weserv.nl/?url=${encodeURIComponent(
        parsed.host + parsed.pathname + parsed.search,
      )}`;
      imgResp = await fetch(proxied, { redirect: "follow" });
    }
    if (!imgResp.ok) {
      throw new Error(
        `El sitio de origen bloqueó la descarga (${imgResp.status}). Descarga la imagen manualmente y súbela desde tu equipo.`,
      );
    }
    const ctRaw = imgResp.headers.get("content-type") || "image/jpeg";
    if (!ctRaw.toLowerCase().startsWith("image/")) {
      throw new Error("URL did not return an image");
    }

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
