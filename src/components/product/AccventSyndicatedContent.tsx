import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";

/**
 * Contenido sindicado de Accvent (Forza, KlipXtreme, Primus, Nexxt).
 *
 * QUE ES, EXACTAMENTE: el loader de Accvent NO inyecta HTML en la pagina. Crea
 * un <iframe> hacia el sitio del fabricante (p. ej.
 * forzaups.com/es/sindicated/?search=HT-1000LCD) y ajusta su alto por
 * postMessage. Consecuencias que mandan sobre como se usa aqui:
 *
 *  1. El contenido pertenece al dominio del fabricante. NO aporta SEO a
 *     netpowerit.co. Va DEBAJO del contenido propio y nunca lo reemplaza.
 *  2. Es cross-origin: no se puede leer desde el cliente. Lo unico observable
 *     es si aparecio el <iframe>, y en eso se apoya el estado de carga.
 *  3. El alto llega DESPUES de cargar. Por eso el marco reserva alto: sin eso
 *     el salto se cuenta como CLS, que si es senal de ranking.
 *
 * Nunca se monta si el producto no tiene `mpn`: el script busca por
 * coincidencia exacta y un identificador inventado no devuelve nada.
 */

const LOADER = "https://accvent.com/scripting/loader-max.js";
const CONTENEDOR_ID = "load-accvent-content";
const SCRIPT_ID = "accvent-loader";

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

/**
 * El script de Accvent se descarga UNA vez por sesion. Verificado contra el
 * codigo del loader: `accventLoaderSyndicate()` lee sus parametros con
 * `document.getElementById("accvent-loader").getAttribute("data-…")` y el
 * contenedor con `getElementById("load-accvent-content")`. No usa
 * `document.currentScript`. Por eso al cambiar de producto basta con recrear el
 * elemento de parametros SIN `src` y volver a llamar a la funcion: cero red.
 */
let descargaLoader: Promise<void> | null = null;

function asegurarLoader(): Promise<void> {
  if (typeof window.accventLoaderSyndicate === "function") return Promise.resolve();
  if (descargaLoader) return descargaLoader;
  descargaLoader = new Promise<void>((listo, falla) => {
    const s = document.createElement("script");
    s.src = LOADER;
    s.async = true;
    s.onload = () => listo();
    s.onerror = () => {
      descargaLoader = null; // que un fallo de red no deje la promesa envenenada
      falla(new Error("no se pudo descargar el loader de Accvent"));
    };
    document.head.appendChild(s);
  });
  return descargaLoader;
}

/** Programa trabajo para cuando el navegador este libre, con red de seguridad. */
function cuandoEsteLibre(fn: () => void): () => void {
  // requestIdleCallback no existe en Safari viejo y no se entrega en pestanas
  // ocultas, asi que siempre va acompanado de un temporizador.
  const red = window.setTimeout(fn, 2500);
  let idle: number | null = null;
  if (typeof window.requestIdleCallback === "function") {
    idle = window.requestIdleCallback(() => fn(), { timeout: 1500 });
  }
  return () => {
    window.clearTimeout(red);
    if (idle !== null && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(idle);
    }
  };
}

interface Props {
  /** Modelo del fabricante, ya limpio. Sin esto el componente no renderiza. */
  mpn?: string | null;
  /** Nombre de la marca tal como esta en el catalogo, p. ej. "Forza". */
  marca?: string | null;
  lang?: "es" | "en";
}

type Estado = "esperando" | "cargando" | "listo" | "error";

export default function AccventSyndicatedContent({ mpn, marca, lang = "es" }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<Estado>("esperando");
  const codigo = codigoDeMarca(marca);
  const aplica = Boolean(mpn && codigo);

  useEffect(() => {
    if (!aplica) return;
    let cancelado = false;
    let observador: MutationObserver | null = null;
    let expira: number | null = null;

    const arrancar = async () => {
      if (cancelado) return;
      const nodo = host.current;
      if (!nodo) return;
      setEstado("cargando");

      nodo.id = CONTENEDOR_ID;
      nodo.innerHTML = "";

      // El iframe es cross-origin: lo unico que se puede saber es si aparecio.
      observador = new MutationObserver(() => {
        if (nodo.querySelector("iframe") && !cancelado) {
          setEstado("listo");
          observador?.disconnect();
          if (expira !== null) window.clearTimeout(expira);
        }
      });
      observador.observe(nodo, { childList: true, subtree: true });
      expira = window.setTimeout(() => {
        if (!cancelado && !nodo.querySelector("iframe")) setEstado("error");
      }, 12000);

      try {
        await asegurarLoader();
      } catch {
        if (!cancelado) setEstado("error");
        return;
      }
      if (cancelado) return;

      // Elemento de parametros. Sin `src`: el loader ya esta en memoria y solo
      // necesita leer estos atributos por id.
      document.getElementById(SCRIPT_ID)?.remove();
      const params = document.createElement("script");
      params.id = SCRIPT_ID;
      params.type = "text/javascript";
      params.setAttribute("data-search", String(mpn));
      params.setAttribute("data-brand", String(codigo));
      params.setAttribute("data-lang", lang);
      nodo.appendChild(params);

      try {
        window.accventLoaderSyndicate?.();
      } catch {
        if (!cancelado) setEstado("error");
      }
    };

    const cancelarProgramacion = cuandoEsteLibre(() => {
      void arrancar();
    });

    return () => {
      // Limpieza obligatoria: el loader crea #avloading y #aviframe con id fijo,
      // asi que dos instancias vivas a la vez dan ids duplicados.
      cancelado = true;
      cancelarProgramacion();
      observador?.disconnect();
      if (expira !== null) window.clearTimeout(expira);
      document.getElementById(SCRIPT_ID)?.remove();
      const nodo = host.current;
      if (nodo) {
        nodo.innerHTML = "";
        nodo.removeAttribute("id");
      }
    };
  }, [aplica, mpn, codigo, lang]);

  if (!aplica) return null;

  return (
    <>
      {/* Preconexion: ahorra DNS + TLS antes de que se pida el script. Solo se
          declara en las fichas que de verdad van a usar el sindicado. */}
      <Helmet>
        <link rel="preconnect" href="https://accvent.com" />
        <link rel="preconnect" href="https://www.forzaups.com" />
        <link rel="dns-prefetch" href="https://accvent.com" />
        <link rel="dns-prefetch" href="https://www.forzaups.com" />
      </Helmet>

      <section className="mt-8" aria-labelledby="accvent-titulo">
        <h2 id="accvent-titulo" className="text-xl font-extrabold text-foreground mb-1">
          Ficha técnica del fabricante
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Contenido oficial de {marca}, actualizado por el fabricante. Modelo {mpn}.
        </p>

        <div
          className="relative rounded-lg border border-border bg-card overflow-hidden"
          style={{ minHeight: 420 }}
        >
          <div ref={host} style={{ margin: "0 auto" }} />

          {estado !== "listo" && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center"
              aria-live="polite"
            >
              {estado === "error" ? (
                <p className="text-sm text-muted-foreground max-w-sm">
                  No se pudo cargar la ficha del fabricante. Las especificaciones
                  completas están más arriba, en la pestaña Especificaciones.
                </p>
              ) : (
                <>
                  <span className="text-lg font-extrabold tracking-wide text-muted-foreground/70">
                    {marca}
                  </span>
                  <div className="w-full max-w-md space-y-3" aria-hidden="true">
                    <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
                    <div className="h-40 w-full rounded bg-muted animate-pulse" />
                    <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cargando catálogo interactivo oficial…
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
