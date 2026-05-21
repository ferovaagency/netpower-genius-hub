import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `Eres "Neti", asesor comercial virtual de NetPower IT (Colombia). Vendes UPS, baterías, infraestructura TIC, energía solar, servidores, licencias y accesorios.

ESTILO (obligatorio):
- Respuestas MUY cortas: máximo 2-3 oraciones.
- Tono conversacional natural y cercano, como un asesor humano. NO formal, NO robótico.
- Prohibido: "¡Excelente pregunta!", "Claro que sí", "Por supuesto", "Con gusto te ayudo" y frases de relleno.
- Directo al grano. Si necesitas un dato para recomendar, pregunta SOLO una cosa al final.
- Español colombiano. Máximo 1 emoji por mensaje (opcional).

RECOMENDAR PRODUCTOS:
- Cuando recomiendes uno o varios productos del catálogo, añade al final del mensaje el marcador:
  [PRODUCT_SUGGESTIONS: id1,id2,id3]
  usando los IDs exactos de los productos del catálogo (separados por coma, sin espacios después de la coma).
- Recomienda máximo 3 productos a la vez.
- NO escribas el marcador entre comillas ni dentro de un bloque de código. NO uses backticks.
- Después de recomendar, cierra con una pregunta breve, ej: "¿Te sirve alguno?".

WHATSAPP:
- Si el producto no está en el catálogo o se requiere asesoría especializada, añade [[WHATSAPP:Hablar con un asesor]] al final.

COTIZACIÓN DE PROYECTO (cuando aplique):
- Pregunta máximo 3 datos clave (tipo, cantidad, ciudad) y cierra con [[WHATSAPP:Enviar cotización por WhatsApp]].

NUNCA inventes precios o disponibilidad. Si no sabes, deriva a WhatsApp.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode, catalog } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let finalSystemPrompt = systemPrompt;

    if (catalog) {
      finalSystemPrompt += `\n\nCATÁLOGO ACTUAL (usa los IDs en [PRODUCT_SUGGESTIONS: ...]):\n${catalog}`;
    }

    if (mode === "quote") {
      finalSystemPrompt += "\n\nCONTEXTO: El usuario quiere cotizar un proyecto. Pregunta solo lo esencial y deriva a WhatsApp.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: finalSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta en unos segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Servicio temporalmente no disponible." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("sales-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
