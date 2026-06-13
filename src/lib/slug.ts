import { supabase } from "@/lib/supabase";

const STOP_WORDS = new Set([
  "de", "del", "la", "las", "el", "los", "un", "una", "unos", "unas",
  "y", "o", "u", "para", "por", "con", "sin", "en", "al", "a", "the",
  "of", "and", "for", "with",
]);

/**
 * Genera un slug SEO-friendly:
 * - sin acentos ni caracteres especiales
 * - sin stop-words (palabras vacías)
 * - máximo 30 caracteres
 * - solo a-z, 0-9 y guiones
 */
export const generateSlug = (value: string): string => {
  const words = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean)
    .filter((word) => !STOP_WORDS.has(word));

  // Deduplicar palabras dentro del slug
  const seen = new Set<string>();
  const unique = words.filter((w) => {
    if (seen.has(w)) return false;
    seen.add(w);
    return true;
  });

  let slug = "";
  for (const w of unique) {
    const next = slug ? `${slug}-${w}` : w;
    if (next.length > 30) break;
    slug = next;
  }

  return (slug || "producto").replace(/-+$/g, "");
};

/**
 * Garantiza que el slug no exista ya en la tabla `products`.
 * Si existe, agrega un sufijo numérico corto (-2, -3, ...) sin pasar de 30 chars.
 * `ignoreId` permite excluir el producto que se está editando.
 */
export const ensureUniqueSlug = async (
  base: string,
  ignoreId?: string,
): Promise<string> => {
  const baseSlug = generateSlug(base);
  let candidate = baseSlug;
  let i = 2;

  while (true) {
    let query = supabase.from("products").select("id").eq("slug", candidate).limit(1);
    if (ignoreId) query = query.neq("id", ignoreId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;

    const suffix = `-${i}`;
    const trimmed = baseSlug.slice(0, Math.max(1, 30 - suffix.length)).replace(/-+$/g, "");
    candidate = `${trimmed}${suffix}`;
    i++;
    if (i > 50) return candidate; // safety
  }
};
