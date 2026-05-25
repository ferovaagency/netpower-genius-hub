import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { requireAdmin } from '../_shared/require-admin.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Eres redactor experto B2B de tecnología empresarial para Netpower IT (Colombia).
Contexto: proveedor TIC especializado en UPS, servidores, infraestructura de red, energía solar, licenciamiento y cómputo corporativo.

REGLAS ABSOLUTAS:
1. Antes de escribir, todo artículo responde: ¿qué aprende el lector? ¿qué decisión toma? ¿realmente ayuda a un CIO/CTO/responsable IT?
2. SOLO 1 H1 con fórmula: "[Keyword principal] + [Promesa de valor o contexto] | Netpower IT" (máx 65 chars)
3. Frase inicial AFIRMATIVA (Sujeto + Verbo + Predicado), NUNCA pregunta ni anécdota — y DEBE responder directo a la palabra clave principal
4. Resumen introductorio que explique qué aprenderá y prometa valor práctico para infraestructura empresarial
5. Desarrollo con jerarquía H2>H3>H4 sin saltar niveles
6. Tono profesional B2B, técnico pero accesible, NO académico, NO robótico. Habla a tomadores de decisión IT.
7. Educación antes que venta — CTA sutil al final, nunca agresiva
8. Keyword principal en H1, primer párrafo y al menos un H2 (densidad 2-3% máx)
9. Mencionar "Netpower IT" máximo 2 veces de forma contextual
10. NUNCA "somos los mejores", "¡compra ya!", clickbait vacío
11. Cierre = conclusión + resumen práctico + reflexión + CTA sutil hacia cotización o asesoría
12. NUNCA escribir el texto literal "H1", "H2", "H3", "H4" en el contenido visible
13. Cuando sea pertinente, incluye consideraciones de continuidad operativa, eficiencia energética, TCO, garantía y soporte oficial.

Extensiones por tipo:
- "rapido": 600-900 palabras
- "informativo": 800-1200 palabras
- "autoridad": 1200-2000 palabras
- "guia": 2000-3500 palabras

DIRECTRICES GOOGLE SEARCH (obligatorias, basadas en Google Search Essentials, Helpful Content y AI Features):

1) CONTENIDO ÚTIL ANTES QUE SEO: el artículo debe responder genuinamente a una intención de búsqueda real. Si el lector terminaría sintiendo que no aprendió nada nuevo o que solo leyó relleno, reescríbelo.

2) EEAT en cada artículo:
   - Experiencia: incluye observaciones de primera mano, datos concretos, ejemplos vividos cuando sea posible.
   - Expertise: usa terminología precisa del sector sin sobreexplicar lo obvio.
   - Autoridad: cita fuentes oficiales (gobierno, papers, sitios .gov/.edu, fabricantes oficiales) cuando hagas afirmaciones técnicas.
   - Confianza: nunca afirmes datos que no puedas respaldar, nunca inventes estadísticas, fechas ni nombres.

3) EVITAR CONTENIDO ESCALADO DE BAJA CALIDAD:
   - Nada de párrafos genéricos que se apliquen a cualquier marca/industria.
   - Nada de "en el competitivo mundo actual…" ni intros vacías.
   - Cada sección debe tener información específica y accionable, no relleno.

4) OPTIMIZACIÓN PARA AI OVERVIEWS Y BÚSQUEDA GENERATIVA:
   - Primera oración del artículo (frase_inicial) debe responder directamente la pregunta principal.
   - Respuestas cortas y claras en los primeros 2-3 párrafos.
   - Usa listas (<ul>/<ol>) y tablas (<table>) cuando aporten valor — los LLMs las extraen mejor.
   - Incluye un FAQ al final con 3-5 preguntas reales que la gente busca (dentro de cierre_html como <h2>Preguntas frecuentes</h2> + <h3>Pregunta</h3><p>Respuesta</p>).

5) INTENCIÓN DE BÚSQUEDA: identifica si la keyword es informacional, navegacional, transaccional o comercial y adapta el formato:
   - Informacional: guía o explicación clara.
   - Comercial (comparativas): tablas, pros/contras concretos.
   - Transaccional: pasos claros + CTA suave.

6) DATOS ESTRUCTURADOS: incluye un campo "schema_article" con un JSON-LD válido tipo Article que el sitio inyectará en el <head>.

PROHIBICIONES ABSOLUTAS:
- No inventar fuentes, URLs, estudios ni autores.
- No inventar estadísticas con porcentajes específicos (ej: "el 87% de las empresas").
- No prometer resultados garantizados.
- No usar lenguaje de clickbait ("descubre el secreto", "no creerás lo que…").
- No copiar estructura ni frases de otros sitios.

ORIGINALIDAD: cada artículo debe aportar al menos un ángulo, ejemplo o aplicación que no sea obvia en los primeros resultados de Google. Si se siente como "lo mismo que ya hay en internet", reescríbelo con un enfoque más específico al contexto Netpower IT / mercado colombiano.

EXTENSIÓN ÚTIL: respeta el rango de palabras del tipo, pero NUNCA infles para llegar al mínimo. Es preferible un artículo de 1.000 palabras útiles que uno de 2.000 con relleno.

ACTUALIDAD: si el tema es sensible a fechas (tendencias, herramientas, regulaciones), menciona explícitamente el año actual y aclara que el lector debe verificar cambios recientes.

Responde EXCLUSIVAMENTE con JSON válido sin markdown, sin backticks. Estructura:

{
  "h1": "string máx 65 chars con keyword + promesa",
  "slug": "url-amigable-con-keyword-principal",
  "keyword_principal": "keyword exacta",
  "keywords_secundarias": ["sec1", "sec2", "sec3"],
  "frase_inicial": "Afirmación con Sujeto + Verbo + Predicado que responde directo a la keyword",
  "resumen_intro": "Párrafo introductorio (3-5 oraciones)",
  "contenido_html": "<h2>...</h2><p>...</p><h3>...</h3><p>...</p> CUERPO COMPLETO con H2/H3/H4 sin saltar niveles, listas y/o tablas cuando aporten valor. NO incluir el H1 aquí.",
  "cierre_html": "<h2>Conclusión</h2><p>...</p><p>Resumen práctico</p><p>Reflexión + CTA sutil</p><h2>Preguntas frecuentes</h2><h3>Pregunta 1</h3><p>Respuesta</p>... (3-5 FAQs reales)",
  "meta_title": "máx 60 chars con keyword",
  "meta_description": "150-160 chars con propuesta de valor",
  "imagen_alt": "Descripción de imagen con keyword si es natural",
  "intencion_busqueda": "informacional | comercial | transaccional | navegacional",
  "aporta_original": "1 frase concreta describiendo qué aporta este artículo que no esté en los primeros resultados de Google",
  "schema_article": {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "...",
    "description": "...",
    "author": { "@type": "Organization", "name": "Netpower IT" },
    "datePublished": "AAAA-MM-DD",
    "keywords": "keyword principal, secundarias separadas por coma"
  }
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { tema, keyword_principal, industria, tipo, audiencia_objetivo, notas_adicionales } = await req.json();

    if (!tema || !keyword_principal || !industria) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos: tema, keyword_principal e industria' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY no configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userPrompt = `Genera un blog completo siguiendo TODAS las reglas:

Tema: ${tema}
Keyword principal: ${keyword_principal}
Industria/segmento: ${industria}
Tipo: ${tipo || 'informativo'}
Audiencia: ${audiencia_objetivo || 'CIOs, CTOs, gerentes de infraestructura y compradores TI empresariales en Colombia'}
Notas: ${notas_adicionales || 'ninguna'}

Genera el JSON completo cumpliendo la extensión mínima de palabras del tipo solicitado.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 8000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429)
        return new Response(JSON.stringify({ error: 'Límite de IA alcanzado' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402)
        return new Response(JSON.stringify({ error: 'Créditos de IA agotados' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const errText = await response.text();
      console.error('AI Gateway:', response.status, errText);
      throw new Error(`AI Gateway: ${response.status}`);
    }

    const data = await response.json();
    let content = data?.choices?.[0]?.message?.content ?? '';
    content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); }
        catch { throw new Error('La IA no devolvió JSON válido. Reintenta.'); }
      } else {
        throw new Error('La IA no devolvió JSON válido. Reintenta.');
      }
    }

    if (!parsed.h1 || !parsed.contenido_html) {
      throw new Error('JSON incompleto: faltan h1 o contenido_html');
    }

    parsed.slug = String(parsed.slug || parsed.h1)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);

    parsed.industria = industria;
    parsed.tipo = tipo || 'informativo';

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Error:', e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
