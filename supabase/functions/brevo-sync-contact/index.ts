// Sync a contact (from quote form / Neti chat) into Brevo list #9.
// Public function (verify_jwt=false) — called from the client after inserting a quote_request.
// The BREVO_API_KEY is stored server-side; never exposed to the browser.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BREVO_LIST_ID = 9;

function isValidEmail(v: unknown): v is string {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!BREVO_API_KEY) {
      return new Response(JSON.stringify({ error: "BREVO_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const email = (body.email || "").toString().trim().toLowerCase();
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "invalid email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Split full name into FIRSTNAME / LASTNAME (Brevo defaults)
    const fullName = (body.name || "").toString().trim().slice(0, 120);
    const [firstName, ...rest] = fullName.split(/\s+/);
    const lastName = rest.join(" ");

    const attributes: Record<string, string> = {};
    if (firstName) attributes.FIRSTNAME = firstName;
    if (lastName) attributes.LASTNAME = lastName;
    if (body.phone) attributes.SMS = String(body.phone).slice(0, 30);
    if (body.phone) attributes.WHATSAPP = String(body.phone).slice(0, 30);
    if (body.city) attributes.CIUDAD = String(body.city).slice(0, 80);
    if (body.nit_cedula) attributes.NIT_CEDULA = String(body.nit_cedula).slice(0, 40);
    if (body.project) attributes.COTIZACION = String(body.project).slice(0, 500);
    if (body.source) attributes.ORIGEN = String(body.source).slice(0, 40);

    // Try create; if 400 dup_contact, PUT to update + add to list.
    const createResp = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        email,
        attributes,
        listIds: [BREVO_LIST_ID],
        updateEnabled: true,
      }),
    });

    if (createResp.ok || createResp.status === 204) {
      return new Response(JSON.stringify({ ok: true, created: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: update existing contact and force-add to list
    const errText = await createResp.text();
    console.error("Brevo create failed", createResp.status, errText);

    const updateResp = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
      method: "PUT",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ attributes, listIds: [BREVO_LIST_ID] }),
    });

    if (!updateResp.ok && updateResp.status !== 204) {
      const t = await updateResp.text();
      console.error("Brevo update failed", updateResp.status, t);
      return new Response(JSON.stringify({ error: "brevo_failed", detail: t }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, updated: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("brevo-sync-contact error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
