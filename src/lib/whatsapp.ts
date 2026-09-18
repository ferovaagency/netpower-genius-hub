// src/lib/whatsapp.ts
//
// Registro de clics a WhatsApp. Complementa a analytics.ts: alla se envia el
// evento a GA4 y a Ads; aca queda la fila que el panel puede trabajar.
//
// Regla de oro, igual que en attribution.ts: esto NUNCA puede tumbar el clic.
// Si falla el registro, la persona igual se va a WhatsApp.

import { supabase } from "@/integrations/supabase/client";
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
 * Inserta la fila del clic. No se espera el resultado: el navegador esta por
 * abrir WhatsApp y bloquear ese salto por una escritura seria peor que perder
 * el dato. Por eso tampoco hay reintento.
 */
export function registrarClicWhatsApp(d: DatosClicWhatsApp): void {
  try {
    // types.ts lo genera Lovable y todavia no conoce esta tabla; el cast se quita
    // cuando se regeneren los tipos despues de aplicar la migracion.
    void (supabase as any)
      .from("whatsapp_clicks")
      .insert({
        ref_code: d.refCode,
        origen: d.origen,
        page_path: d.pagePath,
        product_sku: d.productSku ?? null,
        product_name: d.productName ?? null,
        canal: getCanal(),
        atribucion: getAttributionForDetails(),
      })
      .then(({ error }: { error: { message: string } | null }) => {
        if (error) console.error("No se pudo registrar el clic de WhatsApp:", error.message);
      });
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
