import { useEffect } from "react";
import { trackWhatsAppClick } from "@/lib/analytics";

// DEPENDENCIA IMPLICITA, leer antes de tocar los CTA de WhatsApp:
// este componente solo ve enlaces <a> cuyo href apunte a WhatsApp. Si alguien
// abre WhatsApp con window.open(), con un <button onClick> o con otro dominio,
// el evento deja de dispararse EN SILENCIO: no hay error, solo menos numeros.
// Para enriquecer el dato basta con anadir data-wa-origen="..." al <a>.
const WA_SELECTOR =
  'a[href^="https://wa.me/"], a[href^="https://api.whatsapp.com/"], a[href^="whatsapp:"]';

export default function WhatsAppClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const link = target.closest(WA_SELECTOR) as HTMLAnchorElement | null;
      if (!link) return;
      trackWhatsAppClick({
        origen: link.getAttribute("data-wa-origen") || "no_marcado",
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
