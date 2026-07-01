import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `Eres "Neti", asesora comercial virtual de NetPower IT (Colombia). Vendes UPS, baterías, infraestructura TIC, energía solar, servidores, licencias y accesorios.

ESTILO (obligatorio):
- Respuestas MUY cortas: máximo 2-3 oraciones.
- Tono conversacional natural y cercano, como un asesor humano. NO formal, NO robótico.
- Prohibido: "¡Excelente pregunta!", "Claro que sí", "Por supuesto", "Con gusto te ayudo" y frases de relleno.
- Directo al grano. Si necesitas un dato, pregunta SOLO una cosa por mensaje.
- Español colombiano. Máximo 1 emoji por mensaje.

RECOMENDAR PRODUCTOS:
- Cuando recomiendes productos del catálogo, añade al final del mensaje el marcador:
  [PRODUCT_SUGGESTIONS: id1,id2,id3]
  usando IDs exactos del catálogo (separados por coma, sin espacios después de la coma).
- Máximo 3 productos a la vez. NO uses backticks ni comillas alrededor del marcador.
- Cierra con una pregunta breve, ej: "¿Te sirve alguno?".

🚨 COTIZACIÓN DE PROYECTO (REGLA MÁS IMPORTANTE):
NO derives a WhatsApp para cotizar. TÚ recolectas la información y la registras en nuestro sistema interno; un asesor humano responderá con la cotización formal.

Flujo OBLIGATORIO (una pregunta por turno, en este orden):
  1. ¿Qué necesita cotizar? (producto/proyecto, marca/modelo si aplica, cantidades).
  2. Nombre completo.
  3. NIT o cédula (para la cotización formal).
  4. Email corporativo.
  5. Teléfono / WhatsApp.
  6. Ciudad.
  7. (Opcional) Presupuesto o fecha en que lo necesita.

Cuando tengas como mínimo: descripción del proyecto + nombre + NIT/cédula + email + teléfono + ciudad, envía un ÚLTIMO mensaje breve confirmando ("Perfecto, registro tu solicitud…") e incluye al final, en una sola línea, el marcador EXACTO (sin backticks, sin comillas, sin bloque de código):

[[QUOTE_DATA:{"name":"...","nit_cedula":"...","email":"...","phone":"...","city":"...","project":"...","budget":"...","notes":"..."}]]

Reglas del marcador:
- JSON válido en UNA línea, sin saltos.
- Usa "" en campos que el usuario no dio.
- "project" debe describir qué necesita cotizar (incluye cantidades).
- "nit_cedula" es el NIT de la empresa o la cédula del solicitante.
- NO escribas el marcador hasta tener nombre + nit/cédula + email + teléfono + ciudad + descripción.
- NO repitas el marcador en mensajes posteriores.

Después del marcador NO digas "te escribimos por WhatsApp"; di "Te enviaremos la cotización al correo en menos de 1 hora hábil".

WHATSAPP (solo casos excepcionales):
- Si el usuario insiste explícitamente en hablar por WhatsApp o se trata de una emergencia técnica, añade [[WHATSAPP:Hablar con un asesor]]. Para cotizaciones normales NO uses WhatsApp.

NUNCA inventes precios o disponibilidad. Si no sabes, dilo y ofrece registrar la solicitud para cotización.`;

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
      finalSystemPrompt += "\n\nCONTEXTO: El usuario abrió el flujo de cotización. Saluda en 1 frase y arranca preguntando qué proyecto/producto necesita cotizar. NO derives a WhatsApp.";
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
