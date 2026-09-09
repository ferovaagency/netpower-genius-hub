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
