import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import ProductCard from "@/components/store/ProductCard";
import { brands } from "@/data/store-data";
import { fetchAllProducts } from "@/hooks/useProducts";
import type { Product } from "@/types/store";
import NotFound from "./NotFound";
import bannerForzaAtlasSecundario from "@/assets/banner-forza-atlas-secundario.jpg";

const norm = (v?: string | null) => (v ?? "").trim().toLocaleLowerCase("es");

/**
 * Familias de la marca. Agrupan por PROBLEMA que resuelve el equipo, no por
 * codigo de serie: quien busca no sabe que "FVR" es un regulador.
 * `prefijos` se compara contra el MPN, que es donde vive la serie real.
 */
interface Familia {
  clave: string;
  titulo: string;
  descripcion: string;
  prefijos: string[];
}

const FAMILIAS: Record<string, Familia[]> = {
  forza: [
    {
      clave: "proteccion",
      titulo: "Reguladores y protectores",
      descripcion: "Para puestos de trabajo, electrodomésticos y equipos sueltos que solo necesitan voltaje estable.",
      prefijos: ["FVR", "FVP", "ZION", "FSP", "PS-"],
    },
    {
      clave: "interactiva",
      titulo: "UPS interactivas",
      descripcion: "Respaldo para oficinas, estaciones de trabajo y servidores pequeños.",
      prefijos: ["NT-", "HT-", "SL-", "FX-", "BT-", "DC-"],
    },
    {
      clave: "online",
      titulo: "UPS online para empresa",
      descripcion: "Doble conversión para centros de datos, equipo médico e industria. Se cotizan por proyecto.",
      prefijos: ["FDC", "FTP"],
    },
    {
      clave: "portatil",
      titulo: "Energía portátil y solar",
      descripcion: "Estaciones de energía y paneles para trabajo en campo y respaldo móvil.",
      prefijos: ["FPP", "FPV"],
    },
    {
      clave: "baterias",
      titulo: "Baterías de reemplazo",
      descripcion: "Baterías selladas para mantener en servicio la UPS que ya tienes.",
      prefijos: ["FUB"],
    },
  ],
};

function familiaDe(p: Product, familias: Familia[]): string {
  const ref = (p.mpn || p.sku || "").toUpperCase();
  const hit = familias.find((f) => f.prefijos.some((pre) => ref.startsWith(pre)));
  return hit?.clave ?? "otros";
}

export default function BrandPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const marca = brands.find((b) => b.slug === slug);
  const [productos, setProductos] = useState<Product[]>([]);
  const [cargando, setCargando] = useState(true);
  const [familiaActiva, setFamiliaActiva] = useState<string>("todas");

  useEffect(() => {
    let vigente = true;
    fetchAllProducts()
      .then((todos) => {
        if (vigente) setProductos(todos);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, []);

  const familias = FAMILIAS[slug] ?? [];

  const deLaMarca = useMemo(() => {
    if (!marca) return [];
    return productos.filter(
      (p) => p.active !== false && (p.brandId === marca.id || norm(p.brandId) === norm(marca.name)),
    );
  }, [productos, marca]);

  const visibles = useMemo(() => {
    if (familiaActiva === "todas") return deLaMarca;
    return deLaMarca.filter((p) => familiaDe(p, familias) === familiaActiva);
  }, [deLaMarca, familiaActiva, familias]);

  // Una marca que no existe en el catalogo es un 404 de verdad, no una pagina
  // vacia con 200. Es justo el error que ya tiene /producto/* y no se repite.
  if (!marca) return <NotFound />;

  const url = `https://netpowerit.co/marcas/${marca.slug}`;
  const title = `${marca.name} en Colombia — Distribuidor autorizado | Netpower IT`;
  const description = `Catálogo ${marca.name} con precio en pesos, disponibilidad real y garantía en Colombia. Asesoría para elegir la capacidad correcta.`;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
      </Helmet>

      {slug === "forza" && (
        <section className="relative overflow-hidden bg-surface-dark">
          <img
            src={bannerForzaAtlasSecundario}
            alt="Forza Serie Atlas UPS Online — Encuentra la solución Atlas para tu proyecto. Te ayudamos a elegir la UPS adecuada para tu infraestructura."
            width={1918}
            height={482}
            fetchPriority="high"
            loading="eager"
            decoding="sync"
            className="w-full h-auto object-cover"
          />
        </section>
      )}

      <div className="container mx-auto px-4 py-10">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition">Inicio</Link>
          <span>/</span>
          <Link to="/marcas" className="hover:text-primary transition">Marcas</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{marca.name}</span>
        </nav>

        <header className="mb-8 max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">
            {marca.name} en Colombia
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Somos distribuidores de {marca.name} con garantía del fabricante. Aquí tienes
            el catálogo con precio en pesos y disponibilidad real: {deLaMarca.length} referencias.
            Si no sabes qué capacidad necesitas, escríbenos con el equipo que vas a proteger
            y te decimos cuál alcanza.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/cotizacion"
              className="h-11 px-5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm flex items-center"
            >
              Solicitar cotización
            </Link>
            <a
              href="https://wa.me/573504609431"
              data-wa-origen="pagina_marca"
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-5 rounded-lg border border-border text-sm font-medium flex items-center gap-2 hover:bg-accent transition"
            >
              <MessageCircle className="w-4 h-4" /> Preguntar por WhatsApp
            </a>
          </div>
        </header>

        {familias.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setFamiliaActiva("todas")}
                className={`h-9 px-4 rounded-full text-sm font-medium border transition ${
                  familiaActiva === "todas"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                Todo ({deLaMarca.length})
              </button>
              {familias.map((f) => {
                const n = deLaMarca.filter((p) => familiaDe(p, familias) === f.clave).length;
                if (n === 0) return null;
                return (
                  <button
                    key={f.clave}
                    onClick={() => setFamiliaActiva(f.clave)}
                    className={`h-9 px-4 rounded-full text-sm font-medium border transition ${
                      familiaActiva === f.clave
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    {f.titulo} ({n})
                  </button>
                );
              })}
            </div>

            {familiaActiva !== "todas" && (
              <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
                {familias.find((f) => f.clave === familiaActiva)?.descripcion}
              </p>
            )}
          </>
        )}

        {cargando ? (
          <p className="text-muted-foreground">Cargando catálogo…</p>
        ) : visibles.length === 0 ? (
          <p className="text-muted-foreground">
            No hay referencias en esta familia. <Link to="/cotizacion" className="text-primary underline">Cotiza</Link> y la conseguimos.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visibles.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {familias.length > 0 && (
          <section className="mt-12 max-w-3xl">
            <h2 className="text-xl font-extrabold text-foreground mb-4">
              Cómo elegir dentro de {marca.name}
            </h2>
            <dl className="space-y-4">
              {familias.map((f) => (
                <div key={f.clave}>
                  <dt className="font-semibold text-foreground">{f.titulo}</dt>
                  <dd className="text-sm text-muted-foreground">{f.descripcion}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </>
  );
}
