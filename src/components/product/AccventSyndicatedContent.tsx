import { useEffect, useRef, useState } from "react";

/**
 * Contenido sindicado de Accvent (Forza, KlipXtreme, Primus, Nexxt).
 *
 * QUE ES, EXACTAMENTE: el loader de Accvent NO inyecta HTML en la pagina. Crea
 * un <iframe> hacia el sitio del fabricante (p. ej. forzaups.com) y ajusta su
 * alto por postMessage. Consecuencias que mandan sobre como se usa aqui:
 *
 *  1. El contenido pertenece al dominio del fabricante. NO aporta SEO a
 *     netpowerit.co. Va DEBAJO del contenido propio y nunca lo reemplaza.
 *  2. Es cross-origin: no se puede leer desde el cliente ni saber si trajo
 *     algo. No hay deteccion de error posible; solo un tiempo de espera.
 *  3. El alto llega DESPUES de cargar. Si el bloque estuviera arriba, eso es
 *     CLS, que si es senal de ranking. Por eso reserva alto y carga diferida.
 *
 * Nunca se monta si el producto no tiene `mpn`: el script busca por
 * coincidencia exacta y un identificador inventado no devuelve nada.
 */

const LOADER = "https://accvent.com/scripting/loader-max.js";
const CONTAINER_ID = "load-accvent-content";

/** Marcas de la casa Accvent y su codigo. Todo lo demas no tiene sindicado. */
const MARCAS: Record<string, string> = {
  forza: "FORZA",
  klipxtreme: "KLIPXTREME",
  "klip xtreme": "KLIPXTREME",
  primus: "PRIMUS",
  "primus gaming": "PRIMUS",
  "nexxt home": "NEXXT_CONNECTIVITY",
  "nexxt solutions": "NEXXT_CONNECTIVITY",
  "nexxt infraestructura": "NEXXT_INFRASTRUCTURE",
  "nexxt infrastructure": "NEXXT_INFRASTRUCTURE",
};

export function codigoDeMarca(nombre?: string | null): string | null {
  if (!nombre) return null;
  return MARCAS[nombre.trim().toLowerCase()] ?? null;
}

declare global {
  interface Window {
    accventLoaderSyndicate?: () => void;
  }
}

interface Props {
  /** Modelo del fabricante, ya limpio. Sin esto el componente no renderiza. */
  mpn?: string | null;
  /** Nombre de la marca tal como esta en el catalogo, p. ej. "Forza". */
  marca?: string | null;
  lang?: "es" | "en";
}

export default function AccventSyndicatedContent({ mpn, marca, lang = "es" }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const codigo = codigoDeMarca(marca);
  const aplica = Boolean(mpn && codigo);

  // Carga diferida: el script no se pide hasta que el bloque se acerca a
  // pantalla. Mantiene el LCP y el peso inicial fuera de esto.
  useEffect(() => {
    if (!aplica || visible) return;
    const nodo = host.current;
    if (!nodo) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    obs.observe(nodo);
    return () => obs.disconnect();
  }, [aplica, visible]);

  // Montaje del loader. Se rehace cuando cambia el producto.
  useEffect(() => {
    if (!visible || !aplica) return;
    const nodo = host.current;
    if (!nodo) return;

    nodo.id = CONTAINER_ID;
    nodo.innerHTML = "";

    const script = document.createElement("script");
    script.id = "accvent-loader";
    script.type = "text/javascript";
    script.src = LOADER;
    script.async = true;
    script.dataset.search = String(mpn);
    script.dataset.brand = String(codigo);
    script.dataset.lang = lang;
    script.onload = () => {
      try {
        window.accventLoaderSyndicate?.();
      } catch {
        // El sindicado es material de apoyo: si falla, la ficha propia sigue
        // completa y no se rompe nada de la pagina.
      }
    };
    nodo.appendChild(script);

    return () => {
      // Limpieza obligatoria: sin esto, al navegar entre productos quedan
      // varios loaders vivos y el contenedor con el iframe del anterior.
      script.onload = null;
      script.remove();
      nodo.innerHTML = "";
      nodo.removeAttribute("id");
    };
  }, [visible, aplica, mpn, codigo, lang]);

  if (!aplica) return null;

  return (
    <section className="mt-8" aria-labelledby="accvent-titulo">
      <h2 id="accvent-titulo" className="text-xl font-extrabold text-foreground mb-1">
        Ficha técnica del fabricante
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Contenido oficial de {marca}, actualizado por el fabricante. Modelo {mpn}.
      </p>
      {/* min-height reservado: el iframe informa su alto despues de cargar y
          sin esto el salto se cuenta como CLS. */}
      <div
        className="rounded-lg border border-border bg-card overflow-hidden"
        style={{ minHeight: 420 }}
      >
        <div ref={host} style={{ margin: "0 auto" }} />
      </div>
    </section>
  );
}
