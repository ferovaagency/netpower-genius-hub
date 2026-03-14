import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SlidersHorizontal, X } from "lucide-react";
import { products, categories, brands } from "@/data/store-data";
import ProductCard from "@/components/store/ProductCard";

type SortOption = "relevance" | "price-asc" | "price-desc" | "newest";

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const catParam = searchParams.get("categoria");
  const [selectedCategory, setSelectedCategory] = useState(catParam || "");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [sort, setSort] = useState<SortOption>("relevance");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = products.filter(p => p.active);
    if (selectedCategory) list = list.filter(p => categories.find(c => c.id === p.categoryId)?.slug === selectedCategory);
    if (selectedBrand) list = list.filter(p => brands.find(b => b.id === p.brandId)?.slug === selectedBrand);

    switch (sort) {
      case "price-asc": return [...list].sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
      case "price-desc": return [...list].sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
      default: return list;
    }
  }, [selectedCategory, selectedBrand, sort]);

  const clearFilters = () => { setSelectedCategory(""); setSelectedBrand(""); };

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm mb-3 text-foreground">Categorías</h3>
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
        <h3 className="font-semibold text-sm mb-3 text-foreground">Marcas</h3>
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
      {(selectedCategory || selectedBrand) && (
        <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-destructive hover:underline">
          <X className="w-3 h-3" /> Limpiar filtros
        </button>
      )}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Tienda – Productos de Tecnología TIC | NetPower IT</title>
        <meta name="description" content="Explora nuestro catálogo de UPS, baterías, servidores, infraestructura de red, energía solar, monitores y accesorios. Envío a todo Colombia." />
        <link rel="canonical" href="https://netpowerit.co/tienda" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition">Inicio</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Tienda</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">Tienda</h1>
          <div className="flex items-center gap-3">
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortOption)}
              className="h-9 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="relevance">Relevancia</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
              <option value="newest">Más nuevos</option>
            </select>
            <button onClick={() => setFiltersOpen(!filtersOpen)} className="lg:hidden p-2 rounded-lg border border-border hover:bg-accent transition">
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-32 bg-card rounded-xl border border-border p-5 shadow-card">
              <FilterPanel />
            </div>
          </aside>

          {/* Mobile filters */}
          {filtersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-foreground/30" onClick={() => setFiltersOpen(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-card p-6 overflow-auto animate-slide-in-right shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-foreground">Filtros</h2>
                  <button onClick={() => setFiltersOpen(false)}><X className="w-5 h-5" /></button>
                </div>
                <FilterPanel />
              </div>
            </div>
          )}

          {/* Products grid */}
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-4">{filtered.length} productos encontrados</p>
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-lg font-semibold text-foreground mb-2">No se encontraron productos</p>
                <p className="text-sm text-muted-foreground">Intenta cambiar los filtros de búsqueda</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
