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

export const PRODUCT_SUBCATEGORIES: Record<(typeof ALLOWED_PRODUCT_CATEGORIES)[number], string[]> = {
  "Baterías Para UPS": [
    "Baterías 12V 7Ah",
    "Baterías 12V 9Ah",
    "Baterías 12V 18Ah",
    "Baterías de ciclo profundo",
    "Baterías AGM",
    "Baterías de litio",
  ],
  "UPS y Accesorios": [
    "UPS Interactivas (hasta 1.5kVA)",
    "UPS Online doble conversión",
    "UPS para Rack",
    "Reguladores de voltaje",
    "Tarjetas de gestión SNMP",
    "Bypass y PDU",
  ],
  "Infraestructura TIC": [
    "Switches administrables",
    "Switches no administrables",
    "Routers y firewalls",
    "Access Points WiFi",
    "Patch panels y racks",
    "Cableado estructurado",
    "Fibra óptica",
  ],
  "Energía Solar": [
    "Paneles solares",
    "Inversores solares",
    "Controladores de carga",
    "Baterías solares",
    "Kits solares",
    "Estructuras y soportes",
  ],
  "Servidores": [
    "Servidores Torre",
    "Servidores Rack",
    "Servidores Blade",
    "Storage / NAS",
    "Accesorios para servidor",
    "Memoria y discos para servidor",
  ],
  "Licencias": [
    "Microsoft 365",
    "Windows Server",
    "Antivirus y seguridad",
    "Firewall Fortinet",
    "Backup y respaldo",
    "Office y productividad",
  ],
  "Monitores": [
    "Monitores LED",
    "Monitores IPS",
    "Monitores Gaming",
    "Monitores curvos",
    "Monitores profesionales",
    "Soportes para monitor",
  ],
  "Accesorios": [
    "Teclados y mouse",
    "Cables y adaptadores",
    "Audífonos y diademas",
    "Webcams",
    "Memorias USB y discos externos",
    "Impresoras y consumibles",
    "Mochilas y maletines",
  ],
};

export const getSubcategoriesFor = (parent: string | null | undefined): string[] => {
  if (!parent) return [];
  return PRODUCT_SUBCATEGORIES[parent as (typeof ALLOWED_PRODUCT_CATEGORIES)[number]] ?? [];
};

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
