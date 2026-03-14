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

    const systemPrompt = `Eres un redactor técnico experto en productos de tecnología, infraestructura TIC, UPS, energía solar y equipos de cómputo para el mercado colombiano. Generas fichas de producto profesionales, amigables y fáciles de leer para una tienda e-commerce llamada NetPower IT.

GUÍA EDITORIAL:
- Escribe en español colombiano profesional pero cercano y amigable
- Mínimo 800 palabras en la descripción
- Usa terminología técnica precisa pero accesible
- Enfócate en beneficios reales y casos de uso
- Incluye datos técnicos verificables
- No inventes especificaciones, usa solo las proporcionadas
- Usa un tono conversacional y cercano, evitando ser excesivamente formal

ESTRUCTURA DE LA DESCRIPCIÓN (usa formato HTML con etiquetas h2, h3, h4, párrafos y listas):
La descripción DEBE usar etiquetas HTML para estructurar el contenido:
- <h2> para secciones principales
- <h3> para subsecciones
- <h4> para puntos específicos
- <p> para párrafos (máximo 3-4 líneas por párrafo para facilitar la lectura)
- <ul><li> para listas de beneficios
- <strong> para destacar datos importantes
- <blockquote> para el testimonio

Secciones obligatorias de la descripción:
1. Párrafo introductorio enganchador (2-3 líneas)
2. <h2>¿Por qué elegir [producto]?</h2> - Beneficios principales en lenguaje amigable
3. <h2>Características técnicas destacadas</h2> - Desglose técnico accesible con h3 para cada característica
4. <h2>¿Para quién es ideal?</h2> - Casos de uso y público objetivo
5. <h2>Escenarios de implementación</h2> - Ejemplos prácticos de uso
6. <h2>Lo que dicen nuestros clientes</h2> - UN testimonio inventado pero realista de un cliente colombiano (nombre, ciudad, cargo), en blockquote
7. <h2>¿Por qué comprar en NetPower IT?</h2> - Breve cierre con ventajas de comprar con nosotros

RESPUESTA JSON:
{
  "description": "HTML con h2, h3, h4, p, ul, li, blockquote...",
  "shortDesc": "Resumen técnico conciso de 1 línea",
  "specs": {"key": "value"},
  "benefits": ["beneficio 1", "beneficio 2", ...],
  "faqs": [{"question": "...", "answer": "..."}],
  "metaTitle": "Máx 60 chars con keyword",
  "metaDesc": "Máx 160 chars orientada a conversión",
  "suggestedImageSearch": "término de búsqueda sugerido para encontrar imagen del producto",
  "detectedBrand": "Marca detectada del nombre del producto (ej: APC, CDP, HP, Samsung, Logitech, Epson, Dahua, Hikvision, ADATA, AOC, Brother, Targus, Powest, Wattana, Genius, Caixun, Xkim). Si no se reconoce, usa la marca más probable.",
  "detectedCategory": "Categoría detectada (una de: Baterías Para UPS, UPS y Accesorios, Infraestructura TIC, Energía Solar, Servidores, Licencias, Monitores, Accesorios)"
}

Responde SOLO en formato JSON válido con esta estructura exacta.`;

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

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
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
