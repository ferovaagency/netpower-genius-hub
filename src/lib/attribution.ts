// src/lib/attribution.ts
//
// Captura y persiste la atribucion de campana del primer aterrizaje, para poder
// reconciliar un lead de `quote_requests` contra Google Ads.
// Regla de oro: este modulo NUNCA lanza. Si algo falla, degrada a vacio.

const STORAGE_KEY = "npit_attr_v1";
const TTL_MS = 90 * 24 * 60 * 60 * 1000; // ventana de atribucion de Google Ads
const MAX_LEN = 200;

/** wbraid/gbraid cubren iOS, donde no llega gclid. */
const CLICK_IDS = ["gclid", "wbraid", "gbraid"] as const;
const UTMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

export type Attribution = {
  gclid?: string; wbraid?: string; gbraid?: string;
  utm_source?: string; utm_medium?: string; utm_campaign?: string;
  utm_term?: string; utm_content?: string;
  landing_page?: string;
  referrer?: string;
  first_touch_at?: string;
  last_touch_at?: string;
};

type Registro = { v: 1; data: Attribution; expires_at: number };

let memoria: Registro | null = null;

function tieneWindow(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function obtenerStorage(): Storage | null {
  if (!tieneWindow()) return null;
  for (const nombre of ["localStorage", "sessionStorage"] as const) {
    try {
      const s = window[nombre];
      s.setItem("__npit_test__", "1");
      s.removeItem("__npit_test__");
      return s;
    } catch {
      // Safari privado, cookies bloqueadas, iframe sin permisos.
    }
  }
  return null;
}

const limpiar = (v: string | null): string => (v ? v.trim().slice(0, MAX_LEN) : "");

function leerRegistro(): Registro | null {
  const storage = obtenerStorage();
  if (!storage) return memoria;
  try {
    const crudo = storage.getItem(STORAGE_KEY);
    if (!crudo) return memoria;
    const parsed = JSON.parse(crudo) as Registro;
    if (!parsed || parsed.v !== 1 || typeof parsed.expires_at !== "number") return memoria;
    if (Date.now() > parsed.expires_at) {
      try { storage.removeItem(STORAGE_KEY); } catch { /* sin efecto */ }
      memoria = null;
      return null;
    }
    return parsed;
  } catch {
    return memoria;
  }
}

function escribirRegistro(registro: Registro): void {
  memoria = registro;
  const storage = obtenerStorage();
  if (!storage) return;
  try { storage.setItem(STORAGE_KEY, JSON.stringify(registro)); } catch { /* cuota llena */ }
}

/**
 * Fusiona la query actual con lo guardado.
 * - Valor no vacio pisa al anterior (ultimo clic pago gana, igual que Google Ads).
 * - Valor vacio NO pisa: navegar sin parametros no borra la atribucion.
 * - landing_page, referrer y first_touch_at se escriben una sola vez.
 */
export function captureAttribution(): void {
  try {
    if (!tieneWindow()) return;
    const params = new URLSearchParams(window.location.search);
    const previo = leerRegistro();
    const data: Attribution = { ...(previo?.data ?? {}) };
    let nuevo = false;

    for (const clave of [...CLICK_IDS, ...UTMS]) {
      const valor = limpiar(params.get(clave));
      if (valor && valor !== data[clave]) { data[clave] = valor; nuevo = true; }
    }

    if (!data.first_touch_at) {
      data.first_touch_at = new Date().toISOString();
      data.landing_page = limpiar(window.location.pathname + window.location.search);
      const ref = limpiar(document.referrer);
      data.referrer = ref && !ref.includes(window.location.hostname) ? ref : "directo";
      nuevo = true;
    }

    if (!nuevo) return;
    data.last_touch_at = new Date().toISOString();
    escribirRegistro({ v: 1, data, expires_at: Date.now() + TTL_MS });
  } catch {
    // Nunca puede tumbar un render.
  }
}

export function getAttribution(): Attribution | null {
  try { return leerRegistro()?.data ?? null; } catch { return null; }
}

/** Version compacta para guardar en `details` (jsonb). Devuelve {} si no hay nada. */
export function getAttributionForDetails(): Record<string, string> {
  const attr = getAttribution();
  if (!attr) return {};
  const salida: Record<string, string> = {};
  for (const [k, v] of Object.entries(attr)) {
    if (typeof v === "string" && v.length > 0) salida[k] = v;
  }
  return salida;
}

/** true si el lead viene de un clic pago identificable. */
export function hasClickId(): boolean {
  const attr = getAttribution();
  return attr ? CLICK_IDS.some((c) => Boolean(attr[c])) : false;
}

/** Medios que Google y las plataformas usan para trafico pagado. */
const MEDIOS_PAGOS = /^(cpc|ppc|paid|paidsearch|paid_search|paidsocial|paid_social|display|cpm|retargeting|remarketing)$/i;

/** Buscadores, para distinguir organico de referido. */
const BUSCADORES = /(google|bing|yahoo|duckduckgo|ecosia|brave|yandex)\./i;

export type Canal =
  | "Pauta Google Ads"
  | "Pauta"
  | "Organico"
  | "Directo"
  | "Referido"
  | "Desconocido";

/**
 * Clasifica de donde vino el lead, en una sola palabra que un humano pueda leer
 * en el panel sin interpretar utms. El orden importa: un clic pago identificado
 * gana sobre cualquier otra senal, igual que hace la atribucion de Google Ads.
 *
 * Limite conocido: si alguien llega por un anuncio, se va, y vuelve tecleando el
 * dominio dentro de los 90 dias, esto sigue diciendo Pauta. Es el mismo criterio
 * de ultimo clic pago que usa Google, y es deliberado: si no, la pauta nunca se
 * lleva el credito de la venta que origino.
 */
export function getCanal(): Canal {
  try {
    const attr = getAttribution();
    if (!attr) return "Desconocido";

    if (CLICK_IDS.some((c) => Boolean(attr[c]))) return "Pauta Google Ads";
    if (attr.utm_medium && MEDIOS_PAGOS.test(attr.utm_medium)) return "Pauta";
    // utm sin medio pago: campana propia (correo, redes organicas, firma).
    if (attr.utm_source || attr.utm_medium || attr.utm_campaign) return "Referido";

    const ref = attr.referrer || "";
    if (!ref || ref === "directo") return "Directo";
    if (BUSCADORES.test(ref)) return "Organico";
    return "Referido";
  } catch {
    return "Desconocido";
  }
}

/** true solo cuando el lead es atribuible a pauta. Atajo para reportes. */
export function esDePauta(): boolean {
  const c = getCanal();
  return c === "Pauta Google Ads" || c === "Pauta";
}
