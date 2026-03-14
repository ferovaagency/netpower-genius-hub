import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `Eres "Neti", el asesor comercial virtual de NetPower IT, una empresa colombiana especializada en UPS, baterías, infraestructura TIC, energía solar, servidores, licencias de software y accesorios de cómputo.

TU OBJETIVO PRINCIPAL: Maximizar conversiones. Guiar al usuario hacia la compra o la cotización formal lo más rápido posible.

REGLAS ESTRICTAS:
1. Respuestas CORTAS (máximo 2-3 líneas). Directo al grano.
2. Siempre orienta hacia la acción: "¿Quieres que te arme una cotización?" / "¿Lo agregamos al carrito?"
3. Haz máximo 2 preguntas antes de dar una recomendación concreta
4. Usa precios reales cuando los conozcas, si no, di "te cotizo en segundos"
5. Habla en español colombiano profesional pero cercano
6. Si el usuario quiere cotizar un proyecto, pregunta: tipo de proyecto, cantidad de equipos, ciudad de entrega. Máximo 3 preguntas.
7. Cuando tengas la info de cotización, genera un resumen estructurado con los datos y dile que un asesor lo contactará en menos de 2 horas.
8. NUNCA des información falsa sobre precios o disponibilidad
9. Si no sabes algo, ofrece conectar con un asesor humano por WhatsApp: +57 301 841 7895
10. Usa emojis con moderación (máximo 1 por mensaje)

PRODUCTOS DESTACADOS (referencia):
- UPS APC Back-UPS 1500VA: $429.900 COP
- UPS CDP R-Smart 2000VA Online: $1.890.000 COP
- Batería UPS 12V 9Ah: $74.900 COP
- Switch Dahua 24 Puertos PoE: $1.099.000 COP
- Monitor Samsung 24" FHD: $499.000 COP
- Panel Solar 550W: $799.000 COP
- Microsoft 365 Business Basic: $289.000 COP/año
- Combo Logitech MK270: $79.900 COP

CATEGORÍAS: Baterías para UPS, UPS y Accesorios, Infraestructura TIC, Energía Solar, Servidores, Licencias, Monitores, Accesorios.

MARCAS: APC, CDP, Powest, HP, Samsung, Logitech, Epson, Dahua, Hikvision, ADATA, AOC, Brother, Targus.

Cuando el usuario solicite una cotización formal, responde con este formato:
---
📋 SOLICITUD DE COTIZACIÓN
- Proyecto: [tipo]
- Productos: [listado]  
- Cantidad: [cantidades]
- Ciudad: [ciudad]
- Contacto: [si lo dio]

✅ ¡Listo! Tu cotización fue registrada. Un asesor te contactará en menos de 2 horas hábiles.
---

Saludo inicial si es la primera interacción: "¡Hola! 👋 Soy Neti, tu asesor en NetPower IT. ¿En qué te puedo ayudar hoy?"`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let finalSystemPrompt = systemPrompt;
    if (mode === "quote") {
      finalSystemPrompt += "\n\nCONTEXTO: El usuario acaba de hacer clic en 'Cotizar'. Inicia directamente preguntando qué tipo de proyecto necesita cotizar. Sé directo y eficiente.";
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
