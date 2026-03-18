const STOP_WORDS = new Set(["de", "del", "la", "las", "el", "los", "un", "una", "y", "para"]);

export const generateSlug = (value: string): string => {
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !STOP_WORDS.has(word))
    .join("-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

  return (normalized.slice(0, 30).replace(/-+$/g, "") || "producto");
};
