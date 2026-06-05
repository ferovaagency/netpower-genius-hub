// Creates a Wompi Web Checkout signed URL for an order.
// SECURITY: The order total is computed server-side from current product prices
// in the database. The client-supplied `amountCOP` is only used as a sanity
// check — if it mismatches the server total, the request is rejected.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WOMPI_PUBLIC_KEY = Deno.env.get("WOMPI_PUBLIC_KEY") ?? "";
const WOMPI_INTEGRITY_SECRET = Deno.env.get("WOMPI_INTEGRITY_SECRET") ?? "";
const isSandbox = WOMPI_PUBLIC_KEY.startsWith("pub_test_");
const WOMPI_CHECKOUT_BASE = "https://checkout.wompi.co/p/";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface IncomingItem {
  productId?: string;
  quantity?: number;
  unitPrice?: number;
  name?: string;
  sku?: string;
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
      amountCOP,
      customer,
      items,
      shipping_address,
      redirectBaseUrl,
    } = body as {
      reference: string;
      amountCOP: number;
      customer: { name: string; email: string; phone: string };
      items: IncomingItem[];
      shipping_address: unknown;
      redirectBaseUrl: string;
    };

    if (
      !reference ||
      typeof reference !== "string" ||
      !customer?.email ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate items shape
    const cleanItems = items
      .filter((i) => i && typeof i.productId === "string" && Number(i.quantity) > 0)
      .map((i) => ({
        productId: String(i.productId),
        quantity: Math.max(1, Math.min(1000, Math.floor(Number(i.quantity)))),
      }));

    if (cleanItems.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid items" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authoritative price lookup
    const productIds = [...new Set(cleanItems.map((i) => i.productId))];
    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("id, price, sale_price")
      .in("id", productIds);

    if (prodErr) throw prodErr;
    if (!products || products.length !== productIds.length) {
      return new Response(JSON.stringify({ error: "One or more products not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const priceMap = new Map<string, number>();
    for (const p of products) {
      const effective = Number(p.sale_price ?? p.price ?? 0);
      if (!Number.isFinite(effective) || effective <= 0) {
        return new Response(
          JSON.stringify({ error: `Product ${p.id} is not purchasable online` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      priceMap.set(p.id as string, effective);
    }

    // Server-computed total (in pesos)
    let serverTotalCOP = 0;
    for (const i of cleanItems) {
      serverTotalCOP += priceMap.get(i.productId)! * i.quantity;
    }
    serverTotalCOP = Math.round(serverTotalCOP);

    // Tolerate up to 1 COP difference for rounding
    const clientAmount = Math.round(Number(amountCOP) || 0);
    if (Math.abs(clientAmount - serverTotalCOP) > 1) {
      console.warn("Price mismatch", { clientAmount, serverTotalCOP, reference });
      return new Response(
        JSON.stringify({ error: "Order total does not match current product prices" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amountInCents = serverTotalCOP * 100;
    const currency = "COP";

    const signature = await sha256Hex(
      `${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_SECRET}`
    );

    const { error: orderErr } = await supabase.from("orders").upsert(
      {
        reference,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        items,
        total: serverTotalCOP,
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
    return new Response(JSON.stringify({ error: "Unable to create checkout" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
