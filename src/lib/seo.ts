// Reglas SEO compartidas por los generadores de fichas.

/** Largo maximo del meta titulo: estrictamente menor a 60 caracteres. */
export const MAX_TITULO = 59;

// Palabras que no deben quedar al final de un titulo recortado.
const CONECTORES = new Set([
  "de", "del", "la", "las", "el", "los", "un", "una", "y", "o", "u", "para",
  "por", "con", "sin", "en", "al", "a", "-", "|", "–", "—", "+", "/",
]);

/**
 * Devuelve un titulo de menos de 60 caracteres. Si el texto es mas largo,
 * lo corta en el ultimo espacio que cabe y quita conectores y signos sueltos
 * del final, para no dejar palabras partidas.
 */
export function tituloSeo(valor: string | null | undefined, max = MAX_TITULO): string {
  const limpio = (valor ?? "").replace(/\s+/g, " ").trim();
  if (limpio.length <= max) return limpio;
  const palabras = limpio.slice(0, max + 1).split(" ");
  if (palabras.length > 1) palabras.pop(); // la ultima puede estar partida
  while (palabras.length > 1 && CONECTORES.has(palabras[palabras.length - 1].toLowerCase())) palabras.pop();
  const corto = palabras.join(" ").replace(/[\s,;:.\-–—|/+]+$/, "");
  return corto.length > 0 && corto.length <= max ? corto : limpio.slice(0, max).trim();
}
