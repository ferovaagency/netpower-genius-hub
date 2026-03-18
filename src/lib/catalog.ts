export const ALLOWED_PRODUCT_CATEGORIES = [
  "Baterías Para UPS",
  "UPS y Accesorios",
  "Infraestructura TIC",
  "Energía Solar",
  "Servidores",
  "Licencias",
  "Monitores",
  "Accesorios",
] as const;

export const DEFAULT_PRODUCT_CATEGORY = "Accesorios" as const;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

const CATEGORY_BY_NORMALIZED = Object.fromEntries(
  ALLOWED_PRODUCT_CATEGORIES.map((category) => [normalize(category), category]),
) as Record<string, (typeof ALLOWED_PRODUCT_CATEGORIES)[number]>;

export const isAllowedProductCategory = (value: string | null | undefined): value is (typeof ALLOWED_PRODUCT_CATEGORIES)[number] => {
  if (!value) return false;
  return normalize(value) in CATEGORY_BY_NORMALIZED;
};

export const getParentCategory = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    if (!value) continue;
    const exactMatch = CATEGORY_BY_NORMALIZED[normalize(value)];
    if (exactMatch) return exactMatch;
  }

  return DEFAULT_PRODUCT_CATEGORY;
};
