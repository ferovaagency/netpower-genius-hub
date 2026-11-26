// Utilidades de articulos del blog, adaptadas de ferova-core-platform
// (src/lib/blog.ts). Se usan en BlogPostPage y la convencion es la misma:
// un H2 "Preguntas frecuentes", cada pregunta en un H3 y su respuesta en los
// parrafos siguientes. Con eso se genera el schema FAQPage.

const plano = (valor: string) =>
  valor
    .replace(/<\/(p|li|h\d|div|ul|ol)>|<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

export function extraerFaq(html: string): { question: string; answer: string }[] {
  const secciones = html.split(/<h2[^>]*>/i);
  const faq = secciones.find((s) => /preguntas frecuentes|^faqs?$/i.test(plano(s.split(/<\/h2>/i)[0] ?? "")));
  if (!faq) return [];
  return faq
    .split(/<\/h2>/i).slice(1).join("")
    .split(/<h3[^>]*>/i).slice(1)
    .map((trozo) => {
      const [pregunta = "", ...resto] = trozo.split(/<\/h3>/i);
      return { question: plano(pregunta), answer: plano(resto.join(" ")) };
    })
    .filter((f) => f.question && f.answer);
}

export function minutosDeLectura(html: string): number {
  const palabras = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palabras / 220));
}

const aSlug = (valor: string) =>
  valor.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Pone un id a cada H2 y devuelve el indice del articulo. */
export function conIndice(html: string): { html: string; indice: { id: string; label: string }[] } {
  const indice: { id: string; label: string }[] = [];
  const vistos = new Set<string>();
  const resultado = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (_m, attrs: string, interior: string) => {
    const label = plano(interior);
    const base = aSlug(label) || "seccion";
    let id = base;
    for (let n = 2; vistos.has(id); n += 1) id = `${base}-${n}`;
    vistos.add(id);
    indice.push({ id, label });
    return `<h2${attrs.replace(/\sid="[^"]*"/i, "")} id="${id}">${interior}</h2>`;
  });
  return { html: resultado, indice };
}
