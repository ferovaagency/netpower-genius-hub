// Verifies a Wompi transaction against Wompi's public sandbox/production API
// and updates the matching order's status. Called by /resultado-pago after
// the user is redirected back from the Wompi checkout.
//
// SECURITY:
// - Order status transitions are one-way for terminal states: a `completed` or
//   `pending_verification` order is never downgraded by this endpoint, so a
//   third party who learns a transaction id cannot flip a paid order to
//   `failed` (e.g. after a chargeback void).
// - The response no longer leaks the transaction amount.
// - Inputs are validated and length-limited.

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

const TERMINAL_STATUSES = new Set(["completed", "pending_verification", "cancelled"]);

function safeString(v: unknown, max = 128): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t || t.length > max) return null;
  return t;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const transactionId = safeString((body as any).transactionId);
    const reference = safeString((body as any).reference);

    if (!transactionId && !reference) {
      return new Response(JSON.stringify({ error: "transactionId or reference required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let tx: any = null;

    if (transactionId) {
      const r = await fetch(`${WOMPI_API_BASE}/transactions/${encodeURIComponent(transactionId)}`);
      const j = await r.json();
      tx = j?.data;
    } else if (reference) {
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

    const wompiStatus: string = tx.status;
    const ref: string = tx.reference;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const newOrderStatus =
      wompiStatus === "APPROVED"
        ? "completed"
        : wompiStatus === "PENDING"
        ? "pending"
        : "failed";

    // Fetch current order so we never downgrade a terminal status.
    const { data: existing } = await supabase
      .from("orders")
      .select("status")
      .eq("reference", ref)
      .maybeSingle();

    const currentStatus = existing?.status as string | undefined;
    const shouldUpdate =
      !!currentStatus &&
      !TERMINAL_STATUSES.has(currentStatus) &&
      // Don't overwrite an existing `completed` order under any circumstance.
      currentStatus !== "completed" &&
      // Only allow forward transitions from pending -> completed/failed/pending.
      currentStatus !== newOrderStatus;

    if (shouldUpdate) {
      await supabase
        .from("orders")
        .update({
          status: newOrderStatus,
          payment_reference: tx.id,
        })
        .eq("reference", ref)
        .eq("status", currentStatus); // optimistic guard
    }

    return new Response(
      JSON.stringify({
        status: wompiStatus,
        orderStatus: shouldUpdate ? newOrderStatus : currentStatus ?? newOrderStatus,
        reference: ref,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-wompi-transaction error:", err);
    return new Response(JSON.stringify({ error: "Unable to verify transaction" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
