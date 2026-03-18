export const ALLOWED_PRODUCT_CATEGORIES = ["Computadores", "Licenciamiento", "Servidores"] as const;

const CATEGORY_KEYWORDS: Record<(typeof ALLOWED_PRODUCT_CATEGORIES)[number], string[]> = {
  Computadores: ["computador", "portatil", "laptop", "desktop", "pc", "all in one", "monitor", "teclado", "mouse"],
  Licenciamiento: ["licencia", "licenciamiento", "software", "microsoft 365", "office", "windows", "antivirus", "suscripcion"],
  Servidores: ["servidor", "server", "rack", "xeon", "poweredge", "proliant", "blade"],
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

export const getParentCategory = (...values: Array<string | null | undefined>) => {
  const haystack = normalize(values.filter(Boolean).join(" "));

  for (const category of ALLOWED_PRODUCT_CATEGORIES) {
    if (normalize(category) === haystack) return category;
  }

  for (const category of ALLOWED_PRODUCT_CATEGORIES) {
    if (CATEGORY_KEYWORDS[category].some((keyword) => haystack.includes(normalize(keyword)))) {
      return category;
    }
  }

  return "Computadores";
};
