// Creates a Wompi Web Checkout signed URL for an order.
// Flow: client posts order payload -> we insert order in DB with status 'pending'
// and payment_provider 'wompi', then return a signed Wompi URL. The browser
// redirects there. Wompi redirects back to /resultado-pago?id=<transactionId>
// where PaymentResult verifies the transaction status against Wompi public API.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WOMPI_PUBLIC_KEY = Deno.env.get("WOMPI_PUBLIC_KEY") ?? "";
const WOMPI_INTEGRITY_SECRET = Deno.env.get("WOMPI_INTEGRITY_SECRET") ?? "";
// Sandbox vs production is determined by the public key prefix (pub_test_ vs pub_prod_)
const isSandbox = WOMPI_PUBLIC_KEY.startsWith("pub_test_");
const WOMPI_CHECKOUT_BASE = "https://checkout.wompi.co/p/";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!WOMPI_PUBLIC_KEY || !WOMPI_INTEGRITY_SECRET) {
      throw new Error("Wompi credentials not configured");
    }

    const body = await req.json();
    const {
      reference,
      amountCOP, // integer pesos
      customer,
      items,
      shipping_address,
      redirectBaseUrl,
    } = body as {
      reference: string;
      amountCOP: number;
      customer: { name: string; email: string; phone: string };
      items: unknown;
      shipping_address: unknown;
      redirectBaseUrl: string;
    };

    if (!reference || !amountCOP || !customer?.email) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amountInCents = Math.round(amountCOP) * 100;
    const currency = "COP";

    // Wompi integrity signature: SHA256(reference + amountInCents + currency + integritySecret)
    const signature = await sha256Hex(
      `${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_SECRET}`
    );

    // Insert/upsert order in DB
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: orderErr } = await supabase.from("orders").upsert(
      {
        reference,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        items,
        total: amountCOP,
        status: "pending",
        payment_method: "wompi",
        payment_provider: "wompi",
        shipping_address,
      },
      { onConflict: "reference" }
    );
    if (orderErr) throw orderErr;

    const redirectUrl = `${redirectBaseUrl}/resultado-pago?order=${encodeURIComponent(reference)}`;

    const params = new URLSearchParams({
      "public-key": WOMPI_PUBLIC_KEY,
      currency,
      "amount-in-cents": String(amountInCents),
      reference,
      "signature:integrity": signature,
      "redirect-url": redirectUrl,
      "customer-data:email": customer.email,
      "customer-data:full-name": customer.name,
      "customer-data:phone-number": customer.phone || "",
    });

    const checkoutUrl = `${WOMPI_CHECKOUT_BASE}?${params.toString()}`;

    return new Response(
      JSON.stringify({ checkoutUrl, reference, sandbox: isSandbox }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-wompi-checkout error:", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
