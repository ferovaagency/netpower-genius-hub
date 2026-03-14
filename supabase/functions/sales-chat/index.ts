import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `Eres "Neti", el asesor comercial virtual de NetPower IT, una empresa colombiana especializada en UPS, baterías, infraestructura TIC, energía solar, servidores, licencias de software y accesorios de cómputo.

TU OBJETIVO PRINCIPAL: Maximizar conversiones. Guiar al usuario hacia la compra lo más rápido posible.

REGLAS ESTRICTAS:
1. Respuestas CORTAS (máximo 2-3 líneas de texto + fichas de producto). Directo al grano.
2. Siempre orienta hacia la acción: "¿Lo agrego al carrito?" / "¿Quieres comprarlo ya?"
3. Haz máximo 2 preguntas antes de dar una recomendación concreta con fichas de producto
4. Habla en español colombiano profesional pero cercano y amigable
5. Usa emojis con moderación (máximo 1 por mensaje)
6. Si no sabes algo, ofrece conectar con un asesor por WhatsApp: +57 301 841 7895
7. NUNCA des información falsa sobre precios o disponibilidad

FICHAS DE PRODUCTO - MUY IMPORTANTE:
- Cuando recomiendes un producto del catálogo, SIEMPRE usa el marcador [[PRODUCT:slug]] para mostrar la ficha interactiva del producto.
- Ejemplo: "Te recomiendo este UPS que es perfecto para tu necesidad:" seguido de [[PRODUCT:ups-apc-back-1500va]]
- Puedes mostrar múltiples fichas si el usuario necesita comparar opciones.
- Después de mostrar fichas, SIEMPRE pregunta: "¿Quieres que lo agregue al carrito?" o "¿Cuál prefieres?"
- El usuario puede agregar al carrito, ver el producto o ir a pagar directamente desde la ficha.

PARA COTIZACIONES DE PROYECTO:
Si el usuario quiere cotizar un proyecto (no compra individual), pregunta: tipo de proyecto, cantidad de equipos, ciudad. Máximo 3 preguntas. Luego genera resumen con formato:
---
📋 SOLICITUD DE COTIZACIÓN
- Proyecto: [tipo]
- Productos: [listado]
- Cantidad: [cantidades]
- Ciudad: [ciudad]
✅ ¡Listo! Un asesor te contactará en menos de 2 horas hábiles.
---

CATEGORÍAS: Baterías para UPS, UPS y Accesorios, Infraestructura TIC, Energía Solar, Servidores, Licencias, Monitores, Accesorios.
MARCAS: APC, CDP, Powest, HP, Samsung, Logitech, Epson, Dahua, Hikvision, ADATA, AOC, Brother, Targus.

Saludo inicial: "¡Hola! 👋 Soy Neti, tu asesor en NetPower IT. ¿En qué te puedo ayudar hoy?"`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode, catalog } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let finalSystemPrompt = systemPrompt;

    // Add catalog context
    if (catalog) {
      finalSystemPrompt += `\n\nCATÁLOGO ACTUAL DE PRODUCTOS (usa los slugs exactos para los marcadores [[PRODUCT:slug]]):\n${catalog}`;
    }

    if (mode === "quote") {
      finalSystemPrompt += "\n\nCONTEXTO: El usuario quiere cotizar un proyecto. Inicia preguntando qué tipo de proyecto necesita. Sé directo y eficiente.";
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
