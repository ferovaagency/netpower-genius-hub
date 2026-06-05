import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SlidersHorizontal, X, Search } from "lucide-react";
import { categories, brands } from "@/data/store-data";
import { fetchAllProducts } from "@/hooks/useProducts";
import type { Product } from "@/types/store";
import ProductCard from "@/components/store/ProductCard";

type SortOption = "relevance" | "price-asc" | "price-desc" | "newest";

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const { slug: slugParam } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const legacyCatParam = searchParams.get("categoria");
  const queryParam = searchParams.get("q") || "";
  // Backwards-compat redirect: /tienda?categoria=xxx -> /categoria/xxx
  useEffect(() => {
    if (!slugParam && legacyCatParam) {
      navigate(`/categoria/${legacyCatParam}`, { replace: true });
    }
  }, [slugParam, legacyCatParam, navigate]);
  const [selectedCategory, setSelectedCategory] = useState(slugParam || legacyCatParam || "");
  useEffect(() => { if (slugParam) setSelectedCategory(slugParam); }, [slugParam]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [sort, setSort] = useState<SortOption>("relevance");
  const [filtersOpen, setFiltersOpen] = useState(false);
 const [searchQuery, setSearchQuery] = useState(queryParam);
const [allProducts, setAllProducts] = useState<Product[]>([]);
const [loadingProducts, setLoadingProducts] = useState(true);

useEffect(() => {
  fetchAllProducts()
    .then(data => { if (data && data.length > 0) setAllProducts(data.filter(p => p.active)); })
    .catch(() => {})
    .finally(() => setLoadingProducts(false));
}, []);

  const filtered = useMemo(() => {
    let list = allProducts;
    if (searchQuery.trim().length > 1) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.shortDesc.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) list = list.filter(p => {
      const cat = categories.find(c => c.id === p.categoryId || c.name === p.categoryId);
      return cat?.slug === selectedCategory;
    });
    if (selectedBrand) list = list.filter(p => {
      const br = brands.find(b => b.id === p.brandId || b.name === p.brandId);
      return br?.slug === selectedBrand;
    });

    switch (sort) {
      case "price-asc": return [...list].sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
      case "price-desc": return [...list].sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
      default: return list;
    }
  }, [allProducts, selectedCategory, selectedBrand, sort, searchQuery]);

  const clearFilters = () => { setSelectedCategory(""); setSelectedBrand(""); setSearchQuery(""); };

  const FilterPanel = ({ onApply }: { onApply?: () => void } = {}) => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-1 space-y-6 min-h-0">
        <div>
          <h3 className="font-semibold text-sm mb-3 text-foreground sticky top-0 bg-card py-1">Categorías</h3>
          <div className="space-y-1.5">
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(selectedCategory === c.slug ? "" : c.slug)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${selectedCategory === c.slug ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-accent"}`}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-sm mb-3 text-foreground sticky top-0 bg-card py-1">Marcas</h3>
          <div className="space-y-1.5">
            {brands.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBrand(selectedBrand === b.slug ? "" : b.slug)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${selectedBrand === b.slug ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-accent"}`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
        {(selectedCategory || selectedBrand || searchQuery) && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-destructive hover:underline">
            <X className="w-3 h-3" /> Limpiar filtros
          </button>
        )}
      </div>
      {onApply && (
        <div className="pt-4 mt-2 border-t border-border shrink-0">
          <button
            onClick={onApply}
            className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
          >
            Aplicar filtros
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Tienda TIC | Computadores, Servidores, Redes — Netpower IT</title>
        <meta name="description" content="Compra computadores, servidores, equipos de red e impresoras para empresas en Colombia. Netpower IT, tu proveedor TIC en Bogotá." />
        <meta property="og:title" content="Tienda TIC — Netpower IT" />
        <meta property="og:description" content="Computadores, servidores, redes e impresoras para empresas en Colombia." />
        <meta property="og:url" content="https://netpowerit.co/tienda" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://netpowerit.co/tienda" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": "https://netpowerit.co/tienda#page",
          "name": "Tienda TIC — Netpower IT",
          "description": "Computadores, servidores, redes e impresoras para empresas en Colombia",
          "url": "https://netpowerit.co/tienda",
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {"@type":"ListItem","position":1,"name":"Inicio","item":"https://netpowerit.co"},
              {"@type":"ListItem","position":2,"name":"Tienda","item":"https://netpowerit.co/tienda"}
            ]
          }
        })}</script>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition">Inicio</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Tienda</span>
        </nav>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">Tienda</h1>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search bar */}
            <div className="relative">
              <label htmlFor="shop-search" className="sr-only">Buscar productos en la tienda</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <input
                id="shop-search"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar productos..."
                aria-label="Buscar productos"
                className="h-9 pl-9 pr-3 w-48 sm:w-64 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} aria-label="Limpiar búsqueda" className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <label htmlFor="shop-sort" className="sr-only">Ordenar productos</label>
            <select
              id="shop-sort"
              value={sort}
              onChange={e => setSort(e.target.value as SortOption)}
              aria-label="Ordenar productos"
              className="h-9 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="relevance">Relevancia</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
              <option value="newest">Más nuevos</option>
            </select>
            <button onClick={() => setFiltersOpen(!filtersOpen)} aria-label="Abrir filtros" className="lg:hidden p-2 rounded-lg border border-border hover:bg-accent transition">
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar — internal scroll */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-32 bg-card rounded-xl border border-border p-5 shadow-card max-h-[calc(100vh-9rem)]">
              <FilterPanel />
            </div>
          </aside>

          {/* Mobile drawer — overlay, doesn't push content */}
          {filtersOpen && (
            <div className="fixed inset-0 z-[60] lg:hidden">
              <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-card shadow-xl flex flex-col animate-slide-in-right">
                <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
                  <h2 className="font-bold text-foreground">Filtros</h2>
                  <button onClick={() => setFiltersOpen(false)} aria-label="Cerrar"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 min-h-0 p-5 pb-3">
                  <FilterPanel onApply={() => setFiltersOpen(false)} />
                </div>
              </div>
            </div>
          )}

          {/* Products grid */}
          <div className="flex-1">
         {loadingProducts ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
    {[...Array(6)].map((_, i) => <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />)}
  </div>
) : <p className="text-sm text-muted-foreground mb-4">{filtered.length} productos encontrados</p>}
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-lg font-semibold text-foreground mb-2">No se encontraron productos</p>
                <p className="text-sm text-muted-foreground mb-4">Intenta cambiar los filtros de búsqueda</p>
                <a
                  href={`https://wa.me/573018417895?text=${encodeURIComponent(`Hola, busco: ${searchQuery}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-success text-success-foreground text-sm font-semibold hover:opacity-90 transition"
                >
                  Preguntar por WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
