// Verifies a Wompi transaction against Wompi's public sandbox/production API
// and updates the matching order's status. Called by /resultado-pago after
// the user is redirected back from the Wompi checkout.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WOMPI_PUBLIC_KEY = Deno.env.get("WOMPI_PUBLIC_KEY") ?? "";
const isSandbox = WOMPI_PUBLIC_KEY.startsWith("pub_test_");
const WOMPI_API_BASE = isSandbox
  ? "https://sandbox.wompi.co/v1"
  : "https://production.wompi.co/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transactionId, reference } = await req.json();
    if (!transactionId && !reference) {
      return new Response(JSON.stringify({ error: "transactionId or reference required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let tx: any = null;

    if (transactionId) {
      const r = await fetch(`${WOMPI_API_BASE}/transactions/${transactionId}`);
      const j = await r.json();
      tx = j?.data;
    } else {
      const r = await fetch(
        `${WOMPI_API_BASE}/transactions?reference=${encodeURIComponent(reference)}`
      );
      const j = await r.json();
      tx = Array.isArray(j?.data) ? j.data[0] : null;
    }

    if (!tx) {
      return new Response(JSON.stringify({ status: "NOT_FOUND" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wompiStatus: string = tx.status; // APPROVED | DECLINED | VOIDED | ERROR | PENDING
    const ref: string = tx.reference;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const orderStatus =
      wompiStatus === "APPROVED"
        ? "completed"
        : wompiStatus === "PENDING"
        ? "pending"
        : "failed";

    await supabase
      .from("orders")
      .update({
        status: orderStatus,
        payment_reference: tx.id,
      })
      .eq("reference", ref);

    return new Response(
      JSON.stringify({
        status: wompiStatus,
        orderStatus,
        reference: ref,
        amountInCents: tx.amount_in_cents,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-wompi-transaction error:", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
