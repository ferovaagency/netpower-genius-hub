// Edge function: generate-product-sheet
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { productName, brand, category, sku, specs } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const specsText = specs
      ? Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join(", ")
      : "";

    const systemPrompt = `Eres un redactor técnico experto en productos de tecnología, infraestructura TIC, UPS, energía solar y equipos de cómputo para el mercado colombiano. Generas fichas de producto profesionales y detalladas para una tienda e-commerce llamada NetPower IT.

GUÍA EDITORIAL:
- Escribe en español colombiano profesional
- Mínimo 800 palabras en la descripción
- Usa terminología técnica precisa pero accesible
- Enfócate en beneficios reales y casos de uso
- Incluye datos técnicos verificables
- No inventes especificaciones, usa solo las proporcionadas

ESTRUCTURA DE LA FICHA:
1. DESCRIPCIÓN EXTENSA (mín 800 palabras): Descripción detallada del producto con beneficios, casos de uso, comparativas con la competencia, público objetivo y escenarios de implementación.
2. DESCRIPCIÓN CORTA (1 línea): Resumen técnico conciso para listados.
3. TABLA DE ESPECIFICACIONES: Tabla markdown con todas las especificaciones técnicas.
4. BENEFICIOS CLAVE: Lista de 5-7 beneficios reales del producto.
5. PREGUNTAS FRECUENTES: 4-5 FAQs relevantes con respuestas detalladas.
6. META TÍTULO: Máximo 60 caracteres, con keyword principal.
7. META DESCRIPCIÓN: Máximo 160 caracteres, orientada a conversión.

Responde SOLO en formato JSON con esta estructura exacta:
{
  "description": "...",
  "shortDesc": "...",
  "specs": {"key": "value"},
  "benefits": ["..."],
  "faqs": [{"question": "...", "answer": "..."}],
  "metaTitle": "...",
  "metaDesc": "..."
}`;

    const userPrompt = `Genera la ficha de producto para:
- Producto: ${productName}
- Marca: ${brand || "No especificada"}
- Categoría: ${category || "No especificada"}
- SKU: ${sku || "No especificado"}
- Especificaciones conocidas: ${specsText || "No proporcionadas"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido. Intenta en unos minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados. Agrega fondos en tu workspace de Lovable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from the response
    let parsed;
    try {
      // Try direct parse first
      parsed = JSON.parse(content);
    } catch {
      // Try extracting JSON from markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        throw new Error("No se pudo parsear la respuesta de IA");
      }
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-product-sheet error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
