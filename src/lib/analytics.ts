// src/lib/analytics.ts
//
// Unica puerta de salida de eventos de analitica de netpowerit.co.
// Regla: ningun componente llama a gtag/dataLayer directamente.
//
// Garantias:
//  - Nunca lanza. Un fallo de analitica no puede romper un checkout.
//  - Seguro sin window y sin gtag (SSR, tests, bloqueadores).
//  - Nunca envia datos personales: allowlist de claves + filtro de valores.

const TRANSPORT: "gtag" | "gtm" = "gtag";

export type LeadSource = "neti_chat" | "contact_form";
export type Currency = "COP" | "USD";

type EventMap = {
  page_view: { page_path: string; page_location: string };
  cotizacion_enviada: {
    lead_source: LeadSource;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    /** true si hay gclid/wbraid/gbraid. NUNCA se envia el id en si. */
    tiene_gclid?: boolean;
  };
  whatsapp_click: { origen: string; page_path: string };
  compra_completada: {
    transaction_id: string;
    value: number;
    currency: Currency;
    payment_method: string;
    item_count?: number;
  };
};

export type AnalyticsEventName = keyof EventMap;
type Params<K extends AnalyticsEventName> = EventMap[K];

const PARAM_ALLOWLIST: Record<AnalyticsEventName, readonly string[]> = {
  page_view: ["page_path", "page_location"],
  cotizacion_enviada: ["lead_source", "utm_source", "utm_medium", "utm_campaign", "tiene_gclid"],
  whatsapp_click: ["origen", "page_path"],
  compra_completada: ["transaction_id", "value", "currency", "payment_method", "item_count"],
};

// Un valor que huela a dato personal se descarta, aunque su clave este permitida.
const PII_PATTERNS: RegExp[] = [
  /[\w.+-]+@[\w-]+\.[\w.-]+/,
  /(?:\+?57)?[\s-]?3\d{2}[\s-]?\d{3}[\s-]?\d{4}/,
  /\b\d{7,}\b/,
];

const MAX_STRING = 100;

const isDev = (): boolean => {
  try {
    return Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV);
  } catch {
    return false;
  }
};

/** Conserva utm_* y click ids; descarta el resto de la query, que es donde
 *  acaban correos y telefonos por accidente. */
export function stripQuery(url: string): string {
  try {
    const hasOrigin = /^https?:\/\//i.test(url);
    const u = new URL(url, hasOrigin ? undefined : "https://netpowerit.co");
    const kept = new URLSearchParams();
    u.searchParams.forEach((v, k) => {
      if (/^(utm_|gclid$|wbraid$|gbraid$|fbclid$)/i.test(k)) kept.set(k, v);
    });
    const q = kept.toString();
    const path = u.pathname + (q ? `?${q}` : "");
    return hasOrigin ? u.origin + path : path;
  } catch {
    return url.split("?")[0];
  }
}

function sanitize(
  name: AnalyticsEventName,
  raw: Record<string, unknown>
): Record<string, string | number | boolean> {
  const allowed = PARAM_ALLOWLIST[name];
  const out: Record<string, string | number | boolean> = {};

  for (const key of Object.keys(raw)) {
    if (!allowed.includes(key)) continue;
    const value = raw[key];
    if (value === undefined || value === null || value === "") continue;

    if (typeof value === "number") {
      if (Number.isFinite(value)) out[key] = value;
      continue;
    }
    if (typeof value === "boolean") {
      out[key] = value;
      continue;
    }
    if (typeof value === "string") {
      const cleaned = key.startsWith("page_") ? stripQuery(value) : value;
      if (PII_PATTERNS.some((re) => re.test(cleaned))) continue;
      out[key] = cleaned.slice(0, MAX_STRING);
    }
  }
  return out;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function send(name: AnalyticsEventName, raw: Record<string, unknown>): void {
  try {
    if (typeof window === "undefined") return;
    const params = sanitize(name, raw);
    if (isDev()) console.debug("[analytics]", name, params);

    if (TRANSPORT === "gtm") {
      if (!Array.isArray(window.dataLayer)) window.dataLayer = [];
      window.dataLayer.push({ event: name, ...params });
      return;
    }
    if (typeof window.gtag !== "function") return;
    // gtag rellena page_location solo, con la URL cruda. Lo sobreescribimos
    // saneado para que ningun parametro con datos personales entre a GA4.
    window.gtag("event", name, {
      ...params,
      page_location: stripQuery(window.location.href),
    });
  } catch (err) {
    if (isDev()) console.warn("[analytics] fallo al enviar", name, err);
  }
}

const sentInSession = new Set<string>();

/** Una vez por navegador (sobrevive recargas y boton atras). */
function oncePersisted(key: string, fn: () => void): void {
  const storageKey = `npit_analytics_once:${key}`;
  try {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(storageKey)) return;
    window.localStorage.setItem(storageKey, String(Date.now()));
  } catch {
    if (sentInSession.has(storageKey)) return;
    sentInSession.add(storageKey);
  }
  fn();
}

export function trackPageView(p: Params<"page_view">): void {
  send("page_view", p);
}

export function trackCotizacionEnviada(p: Params<"cotizacion_enviada">): void {
  send("cotizacion_enviada", p);
}

export function trackWhatsAppClick(p: Params<"whatsapp_click">): void {
  send("whatsapp_click", p);
}

/** Idempotente por transaction_id: recargar la confirmacion no duplica la compra. */
export function trackCompraCompletada(p: Params<"compra_completada">): void {
  if (!p.transaction_id) return;
  oncePersisted(`purchase:${p.transaction_id}`, () => send("compra_completada", p));
}
