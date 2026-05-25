// Edge function: generate-product-sheet
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAdmin } from "../_shared/require-admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const denied = await requireAdmin(req, corsHeaders);
  if (denied) return denied;

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
- <h2> para secciones principales
- <h3> para subsecciones
- <h4> para puntos específicos
- <p> para párrafos (máximo 3-4 líneas por párrafo)
- <ul><li> para listas de beneficios
- <strong> para destacar datos importantes
- <blockquote> para el testimonio

Secciones obligatorias:
1. Párrafo introductorio enganchador (2-3 líneas) que responda directo a la intención de búsqueda del producto
2. <h2>¿Por qué elegir [producto]?</h2>
3. <h2>Características técnicas destacadas</h2> con h3 por característica
4. <h2>¿Para quién es ideal?</h2>
5. <h2>Escenarios de implementación</h2>
6. <h2>Lo que dicen nuestros clientes</h2> — UN testimonio realista (nombre, ciudad, cargo) en <blockquote>. Debe ser claramente plausible, nunca con estadísticas inventadas.
7. <h2>¿Por qué comprar en NetPower IT?</h2>

DIRECTRICES GOOGLE SEARCH (obligatorias, basadas en Google Search Essentials, Helpful Content y AI Features):

1) CONTENIDO ÚTIL ANTES QUE SEO: la ficha debe ayudar genuinamente a alguien que evalúa comprar el producto. Cero relleno.

2) EEAT:
   - Experiencia: ejemplos concretos de uso real en empresas colombianas.
   - Expertise: terminología precisa del sector sin sobreexplicar lo obvio.
   - Autoridad: si afirmas datos técnicos, refiérelos al fabricante oficial (sin inventar URLs).
   - Confianza: nunca afirmes datos que no puedas respaldar; usa solo specs proporcionadas.

3) EVITAR CONTENIDO ESCALADO DE BAJA CALIDAD:
   - Nada de párrafos genéricos aplicables a cualquier producto/marca.
   - Nada de "en el competitivo mundo actual…".
   - Cada sección con información específica y accionable.

4) OPTIMIZACIÓN PARA AI OVERVIEWS Y BÚSQUEDA GENERATIVA:
   - Primera oración responde directamente "¿qué es y para qué sirve este producto?".
   - Usa listas y tablas cuando aporten valor (los LLMs las extraen mejor).
   - Incluye FAQs útiles al final (campo faqs) con 3-5 preguntas reales que la gente busca antes de comprar.

5) INTENCIÓN DE BÚSQUEDA: una ficha de producto es típicamente transaccional/comercial — incluye pros concretos, escenarios y un CTA suave hacia cotización o compra.

6) DATOS ESTRUCTURADOS: incluye un campo "schema_product" con JSON-LD válido tipo Product que el sitio pueda inyectar.

PROHIBICIONES ABSOLUTAS:
- No inventar fuentes, URLs, estudios ni autores.
- No inventar estadísticas con porcentajes específicos.
- No prometer resultados garantizados.
- Nada de clickbait.
- No copiar estructura ni frases de otros sitios.

ORIGINALIDAD: cada ficha debe aportar al menos un ángulo, ejemplo o escenario específico al mercado colombiano que no sea obvio en los primeros resultados de Google.

EXTENSIÓN ÚTIL: respeta el mínimo de palabras pero NUNCA infles para llegarlo. Mejor 800 palabras útiles que 1.500 con relleno.

RESPUESTA JSON:
{
  "description": "HTML con h2, h3, h4, p, ul, li, blockquote...",
  "shortDesc": "Resumen técnico conciso de 1 línea",
  "specs": {"key": "value"},
  "benefits": ["beneficio 1", "beneficio 2", ...],
  "faqs": [{"question": "...", "answer": "..."}],
  "metaTitle": "Máx 60 chars con keyword",
  "metaDesc": "Máx 160 chars orientada a conversión",
  "suggestedImageSearch": "término de búsqueda sugerido",
  "detectedBrand": "Marca detectada (APC, CDP, HP, Samsung, Logitech, Epson, Dahua, Hikvision, ADATA, AOC, Brother, Targus, Powest, Wattana, Genius, Caixun, Xkim, Microsoft, SAT, 3nStar, Dell, HPE, Kingston, Lenovo, Teltonika, Vertiv)",
  "detectedCategory": "Una de: Baterías Para UPS, UPS y Accesorios, Infraestructura TIC, Energía Solar, Servidores, Licencias, Monitores, Accesorios",
  "intencion_busqueda": "transaccional | comercial | informacional | navegacional",
  "aporta_original": "1 frase concreta sobre qué aporta esta ficha que no esté en los primeros resultados de Google",
  "schema_product": {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "...",
    "description": "...",
    "brand": { "@type": "Brand", "name": "..." },
    "sku": "...",
    "category": "..."
  }
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
