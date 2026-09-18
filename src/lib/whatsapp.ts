// src/lib/whatsapp.ts
//
// Registro de clics a WhatsApp. Complementa a analytics.ts: alla se envia el
// evento a GA4 y a Ads; aca queda la fila que el panel puede trabajar.
//
// Regla de oro, igual que en attribution.ts: esto NUNCA puede tumbar el clic.
// Si falla el registro, la persona igual se va a WhatsApp.

import { getAttributionForDetails, getCanal } from "@/lib/attribution";

/** Codigo corto, legible en un chat y dificil de confundir.
 *  Sin 0/O ni 1/I/L: alguien va a tener que leerlo en voz alta alguna vez. */
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function nuevoRefCode(): string {
  let s = "";
  const buf = new Uint8Array(4);
  try {
    crypto.getRandomValues(buf);
    for (const b of buf) s += ALFABETO[b % ALFABETO.length];
  } catch {
    for (let i = 0; i < 4; i++) s += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  }
  return `NP-${s}`;
}

export type DatosClicWhatsApp = {
  refCode: string;
  origen: string;
  pagePath: string;
  productSku?: string | null;
  productName?: string | null;
};

/**
 * Inserta la fila del clic.
 *
 * POR QUE NO USA EL CLIENTE DE SUPABASE, leer antes de "simplificar" esto:
 * justo despues de este clic el navegador se va a WhatsApp. Una peticion normal
 * lanzada desde una pagina que se esta descargando se CANCELA, y el clic se
 * pierde sin dejar rastro: ni error en consola, ni fila. Por eso va un fetch
 * crudo con `keepalive: true`, que es la unica forma de que el navegador se
 * comprometa a terminar el envio aunque la pagina ya no exista. supabase-js no
 * expone esa opcion por peticion.
 *
 * Tampoco se espera la respuesta: bloquear el salto a WhatsApp por una
 * escritura seria peor que perder el dato.
 */
export function registrarClicWhatsApp(d: DatosClicWhatsApp): void {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return;

    void fetch(`${url}/rest/v1/whatsapp_clicks`, {
      method: "POST",
      keepalive: true,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        ref_code: d.refCode,
        origen: d.origen,
        page_path: d.pagePath,
        product_sku: d.productSku ?? null,
        product_name: d.productName ?? null,
        canal: getCanal(),
        atribucion: getAttributionForDetails(),
      }),
    })
      .then((r) => {
        if (!r.ok) console.error("No se pudo registrar el clic de WhatsApp: HTTP", r.status);
      })
      .catch((e) => console.error("No se pudo registrar el clic de WhatsApp:", e));
  } catch (e) {
    console.error("No se pudo registrar el clic de WhatsApp:", e);
  }
}

/**
 * Mete el codigo al final del texto prellenado del enlace de WhatsApp.
 * Es la unica forma de atar el mensaje que llega al clic que lo origino:
 * WhatsApp corre fuera del sitio y no nos devuelve absolutamente nada.
 */
export function agregarRefAlEnlace(href: string, refCode: string): string {
  try {
    const u = new URL(href, window.location.origin);
    const textoPrevio = u.searchParams.get("text") || "";
    const marca = `(Ref: ${refCode})`;
    if (textoPrevio.includes(marca)) return href;
    u.searchParams.set("text", textoPrevio ? `${textoPrevio} ${marca}` : marca);
    return u.toString();
  } catch {
    return href; // enlace raro: mejor sin codigo que roto
  }
}
