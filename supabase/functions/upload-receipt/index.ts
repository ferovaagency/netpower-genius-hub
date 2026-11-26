// Uploads a payment receipt for a manual-transfer checkout order into the private
// `receipts` bucket without requiring an open client-side storage INSERT policy.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_BYTES = 15 * 1024 * 1024;
const ORDER_REF_RE = /^ORD-\d{10,16}$/;
const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "mif1", "msf1", "heim", "heis", "hevm", "hevs"]);

function detectFormat(bytes: Uint8Array): { ext: string; contentType: string } | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: "jpg", contentType: "image/jpeg" };
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { ext: "png", contentType: "image/png" };
  }
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return { ext: "pdf", contentType: "application/pdf" };
  }
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.slice(start, end));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    return { ext: "webp", contentType: "image/webp" };
  }
  if (ascii(4, 8) === "ftyp" && HEIC_BRANDS.has(ascii(8, 12))) {
    return { ext: "heic", contentType: "image/heic" };
  }
  return null;
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const formData = await req.formData();
    const orderRef = String(formData.get("orderRef") ?? "").trim();
    const file = formData.get("file");

    if (!ORDER_REF_RE.test(orderRef)) {
      return json({ error: "Referencia de pedido inválida" }, 400);
    }
    if (!(file instanceof File) || file.size === 0) {
      return json({ error: "Archivo vacío o faltante" }, 400);
    }
    if (file.size > MAX_BYTES) {
      return json({ error: "El comprobante supera el máximo de 15 MB" }, 413);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const detected = detectFormat(bytes);
    if (!detected) {
      return json({ error: "Formato no admitido. Sube una imagen (JPG, PNG, WEBP, HEIC) o un PDF." }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Reject targeting an order reference that already exists.
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("reference", orderRef)
      .maybeSingle();
    if (existingOrder) {
      return json({ error: "La referencia del pedido ya existe" }, 409);
    }

    const filePath = `${orderRef}/${crypto.randomUUID()}.${detected.ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("receipts")
      .upload(filePath, bytes, {
        upsert: false,
        contentType: detected.contentType,
      });
    if (uploadErr) {
      console.error("Receipt storage upload error:", uploadErr);
      return json({ error: "No se pudo guardar el comprobante" }, 500);
    }

    return json({ path: filePath }, 200);
  } catch (err) {
    console.error("upload-receipt error:", err);
    return json({ error: "Error procesando el comprobante" }, 500);
  }
});