import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const buildFallback = (payload: {
  productName?: string;
  additionalNotes?: string;
  warranty?: string;
  condition?: string;
}) => ({
  description: payload.additionalNotes || `Ficha base generada para ${payload.productName || "producto"}.`,
  short_description: payload.productName || "Producto",
  specs: {},
  meta_title: payload.productName || "Producto",
  meta_description: `Información comercial de ${payload.productName || "producto"}`,
  category: null,
  brand: null,
  reviews: [],
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const payload = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify(buildFallback(payload)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "Responde SOLO JSON válido para catálogo e-commerce con las llaves description, short_description, specs, meta_title, meta_description, category, brand, reviews. category solo puede ser Computadores, Licenciamiento o Servidores.",
          },
          {
            role: "user",
            content: JSON.stringify(payload),
          },
        ],
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify(buildFallback(payload)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      parsed = match ? JSON.parse(match[1].trim()) : buildFallback(payload);
    }

    return new Response(JSON.stringify({ ...buildFallback(payload), ...parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_error) {
    return new Response(JSON.stringify(buildFallback({})), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
