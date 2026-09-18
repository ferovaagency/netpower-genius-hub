import { useEffect } from "react";
import { trackWhatsAppClick } from "@/lib/analytics";
import { nuevoRefCode, registrarClicWhatsApp, agregarRefAlEnlace } from "@/lib/whatsapp";

// DEPENDENCIA IMPLICITA, leer antes de tocar los CTA de WhatsApp:
// este componente solo ve enlaces <a> cuyo href apunte a WhatsApp. Si alguien
// abre WhatsApp con window.open(), con un <button onClick> o con otro dominio,
// el evento deja de dispararse EN SILENCIO: no hay error, solo menos numeros.
// Para enriquecer el dato basta con anadir data-wa-origen="..." al <a>.
const WA_SELECTOR =
  'a[href^="https://wa.me/"], a[href^="https://api.whatsapp.com/"], a[href^="whatsapp:"]';

/** De que producto salio el clic, si salio de una ficha. Se lee del JSON-LD que
 *  ya pinta ProductDetailPage, asi no hay que pasar props por medio sitio. */
function productoDeLaPagina(): { sku: string | null; name: string | null } {
  try {
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      const d = JSON.parse(s.textContent || "{}");
      if (d && d["@type"] === "Product") return { sku: d.sku ?? null, name: d.name ?? null };
    }
  } catch { /* JSON-LD roto: seguimos sin producto */ }
  return { sku: null, name: null };
}

export default function WhatsAppClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const link = target.closest(WA_SELECTOR) as HTMLAnchorElement | null;
      if (!link) return;

      const origen = link.getAttribute("data-wa-origen") || "no_marcado";

      // Un mismo enlace puede clickearse dos veces; el codigo se genera una sola
      // vez por enlace para que el mensaje y la fila no se desincronicen.
      let refCode = link.getAttribute("data-wa-ref");
      if (!refCode) {
        refCode = nuevoRefCode();
        link.setAttribute("data-wa-ref", refCode);
        // Reescribir el href aca funciona porque estamos en fase de captura:
        // corre antes de que el navegador siga el enlace.
        link.href = agregarRefAlEnlace(link.href, refCode);

        const prod = productoDeLaPagina();
        registrarClicWhatsApp({
          refCode,
          origen,
          pagePath: window.location.pathname,
          productSku: prod.sku,
          productName: prod.name,
        });
      }

      trackWhatsAppClick({
        origen,
        page_path: window.location.pathname,
      });
    };
    // Fase de captura: corre antes que cualquier handler de React y antes de
    // que el navegador abra la pestana nueva.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
