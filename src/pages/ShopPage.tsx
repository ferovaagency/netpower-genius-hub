import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronDown, MessageCircle, Search, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "@/components/store/ProductCard";
import { brands, categories } from "@/data/store-data";
import { fetchAllProducts } from "@/hooks/useProducts";
import type { Product } from "@/types/store";

type SortOption = "relevance" | "price-asc" | "price-desc" | "newest";

const normalize = (value: string | null | undefined) => (value ?? "").trim().toLocaleLowerCase("es");

const matchesCategory = (product: Product, slug: string) => {
  if (!slug) return true;
  const category = categories.find(
    (item) => item.id === product.categoryId || normalize(item.name) === normalize(product.categoryId),
  );
  return category?.slug === slug;
};

const matchesBrand = (product: Product, slug: string) => {
  if (!slug) return true;
  const brand = brands.find(
    (item) => item.id === product.brandId || normalize(item.name) === normalize(product.brandId),
  );
  return brand?.slug === slug;
};

const matchesSearch = (product: Product, query: string) => {
  const search = normalize(query);
  if (search.length < 2) return true;
  return [product.name, product.shortDesc, product.sku, product.description]
    .some((value) => normalize(value).includes(search));
};

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const { slug: slugParam } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const legacyCatParam = searchParams.get("categoria");
  const queryParam = searchParams.get("q") || "";
  // La home, el pie de pagina y /marcas enlazan a /tienda?marca=<slug>.
  // Hasta ahora ShopPage nunca leia ese parametro, asi que todos esos enlaces
  // caian en la tienda sin filtrar.
  const marcaParam = searchParams.get("marca") || "";

  const [selectedCategory, setSelectedCategory] = useState(slugParam || legacyCatParam || "");
  const [selectedBrand, setSelectedBrand] = useState(marcaParam);
  useEffect(() => { setSelectedBrand(marcaParam); }, [marcaParam]);
  const [sort, setSort] = useState<SortOption>("relevance");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [brandsOpen, setBrandsOpen] = useState(true);
  const [brandQuery, setBrandQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!slugParam && legacyCatParam) navigate(`/categoria/${legacyCatParam}`, { replace: true });
  }, [slugParam, legacyCatParam, navigate]);

  useEffect(() => setSelectedCategory(slugParam || ""), [slugParam]);

  useEffect(() => {
    let cancelled = false;
    setLoadingProducts(true);
    setLoadError(false);
    fetchAllProducts()
      .then((data) => {
        if (!cancelled) setAllProducts((data || []).filter((product) => product.active));
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!filtersOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [filtersOpen]);

  const categoryCounts = useMemo(() => Object.fromEntries(
    categories.map((category) => [category.slug, allProducts.filter((product) => (
      matchesCategory(product, category.slug)
      && matchesBrand(product, selectedBrand)
      && matchesSearch(product, searchQuery)
    )).length]),
  ), [allProducts, selectedBrand, searchQuery]);

  const brandCounts = useMemo(() => Object.fromEntries(
    brands.map((brand) => [brand.slug, allProducts.filter((product) => (
      matchesBrand(product, brand.slug)
      && matchesCategory(product, selectedCategory)
      && matchesSearch(product, searchQuery)
    )).length]),
  ), [allProducts, selectedCategory, searchQuery]);

  const visibleBrands = useMemo(() => {
    const query = normalize(brandQuery);
    return brands
      .filter((brand) => !query || normalize(brand.name).includes(query))
      .sort((a, b) => (brandCounts[b.slug] || 0) - (brandCounts[a.slug] || 0));
  }, [brandCounts, brandQuery]);

  const filtered = useMemo(() => {
    const list = allProducts.filter((product) => (
      matchesSearch(product, searchQuery)
      && matchesCategory(product, selectedCategory)
      && matchesBrand(product, selectedBrand)
    ));
    if (sort === "price-asc") return [...list].sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
    if (sort === "price-desc") return [...list].sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
    if (sort === "newest") return [...list].reverse();
    return list;
  }, [allProducts, selectedCategory, selectedBrand, sort, searchQuery]);

  const activeCategory = categories.find((category) => category.slug === selectedCategory);
  const activeBrand = brands.find((brand) => brand.slug === selectedBrand);
  const activeFilterCount = Number(Boolean(selectedCategory)) + Number(Boolean(selectedBrand));

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setSearchQuery("");
    setBrandQuery("");
    if (slugParam) navigate("/tienda");
  };

  const handleCategoryClick = (slug: string) => {
    const next = selectedCategory === slug ? "" : slug;
    setSelectedCategory(next);
    navigate(next ? `/categoria/${next}` : "/tienda");
  };

  const FilterPanel = ({ onApply }: { onApply?: () => void } = {}) => (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
        <section className="border-b border-border pb-4">
          <button type="button" className="flex min-h-11 w-full items-center justify-between rounded-lg px-1 text-left text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" aria-expanded={categoriesOpen} onClick={() => setCategoriesOpen((open) => !open)}>
            Categorías
            <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${categoriesOpen ? "rotate-180" : ""}`} />
          </button>
          {categoriesOpen && <div className="mt-1 space-y-1">
            {categories.map((category) => {
              const selected = selectedCategory === category.slug;
              return <button type="button" key={category.id} onClick={() => handleCategoryClick(category.slug)} aria-pressed={selected} className={`flex min-h-10 w-full items-center gap-2 rounded-lg px-2.5 text-left text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${selected ? "bg-accent font-semibold text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <span className="text-primary" aria-hidden="true">{category.lucideIcon}</span>
                <span className="min-w-0 flex-1 truncate">{category.name}</span>
                <span className="tabular-nums text-xs text-muted-foreground">{categoryCounts[category.slug] || 0}</span>
              </button>;
            })}
          </div>}
        </section>

        <section>
          <button type="button" className="flex min-h-11 w-full items-center justify-between rounded-lg px-1 text-left text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" aria-expanded={brandsOpen} onClick={() => setBrandsOpen((open) => !open)}>
            Marcas
            <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${brandsOpen ? "rotate-180" : ""}`} />
          </button>
          {brandsOpen && <div className="mt-1">
            <label htmlFor={onApply ? "mobile-brand-search" : "desktop-brand-search"} className="sr-only">Buscar marca</label>
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input id={onApply ? "mobile-brand-search" : "desktop-brand-search"} value={brandQuery} onChange={(event) => setBrandQuery(event.target.value)} placeholder="Buscar marca" className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary/40" />
            </div>
            <div className="max-h-56 space-y-1 overflow-y-auto overscroll-contain pr-1">
              {visibleBrands.map((brand) => {
                const selected = selectedBrand === brand.slug;
                return <button type="button" key={brand.id} onClick={() => setSelectedBrand(selected ? "" : brand.slug)} aria-pressed={selected} className={`flex min-h-10 w-full items-center gap-2 rounded-lg px-2.5 text-left text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${selected ? "bg-accent font-semibold text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                  <span className="min-w-0 flex-1 truncate">{brand.name}</span>
                  <span className="tabular-nums text-xs text-muted-foreground">{brandCounts[brand.slug] || 0}</span>
                </button>;
              })}
              {visibleBrands.length === 0 && <p className="px-2 py-4 text-center text-xs text-muted-foreground">No encontramos esa marca.</p>}
            </div>
          </div>}
        </section>
      </div>

      {onApply && <div className="mt-4 shrink-0 border-t border-border bg-card pt-4">
        <button type="button" onClick={onApply} className="flex h-12 w-full items-center justify-center rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground shadow-button transition-opacity duration-150 hover:opacity-90 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
          Ver {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
        </button>
      </div>}
    </div>
  );

  const canonicalPath = activeCategory ? `/categoria/${activeCategory.slug}` : "/tienda";
  const canonicalUrl = `https://netpowerit.co${canonicalPath}`;
  const pageTitle = activeCategory ? `${activeCategory.name} | Netpower IT` : "Tienda TIC | Computadores, Servidores, Redes — Netpower IT";
  const pageDesc = activeCategory ? `${activeCategory.description}. Compra ${activeCategory.name} para empresas en Colombia con Netpower IT.` : "Compra computadores, servidores, equipos de red e impresoras para empresas en Colombia. Netpower IT, tu proveedor TIC en Bogotá.";

  return <>
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <link rel="canonical" href={canonicalUrl} />
      <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", "@id": `${canonicalUrl}#page`, name: pageTitle, description: pageDesc, url: canonicalUrl })}</script>
    </Helmet>

    <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
      <nav aria-label="Migas de pan" className="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">Inicio</Link><span aria-hidden="true">/</span>
        <Link to="/tienda" className={activeCategory ? "rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" : "font-semibold text-foreground"}>Tienda</Link>
        {activeCategory && <><span aria-hidden="true">/</span><span className="truncate font-semibold text-foreground">{activeCategory.name}</span></>}
      </nav>

      <div className="mb-6 border-b border-border pb-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-2xl font-extrabold md:text-3xl">{activeCategory?.name || "Tienda"}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{activeCategory?.description || "Encuentra tecnología para tu empresa con asesoría especializada y garantía oficial."}</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <div className="relative min-w-0 sm:flex-1 lg:w-80">
              <label htmlFor="shop-search" className="sr-only">Buscar productos en la tienda</label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input id="shop-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Buscar por producto, marca o SKU" className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-10 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary/40" />
              {searchQuery && <button type="button" onClick={() => setSearchQuery("")} aria-label="Limpiar búsqueda" className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><X className="h-4 w-4" /></button>}
            </div>
            <label htmlFor="shop-sort" className="sr-only">Ordenar productos</label>
            <select id="shop-sort" value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="h-11 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              <option value="relevance">Relevancia</option><option value="price-asc">Menor precio</option><option value="price-desc">Mayor precio</option><option value="newest">Más nuevos</option>
            </select>
            <button type="button" onClick={() => setFiltersOpen(true)} className="flex h-11 items-center justify-center gap-2 rounded-lg border border-input bg-card px-4 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:hidden">
              <SlidersHorizontal className="h-4 w-4" />Filtros
              {activeFilterCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">{activeFilterCount}</span>}
            </button>
          </div>
        </div>

        {(activeCategory || activeBrand) && <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Filtros activos">
          <span className="text-xs font-semibold text-muted-foreground">Filtros activos:</span>
          {activeCategory && <button type="button" onClick={() => handleCategoryClick(activeCategory.slug)} className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-accent px-3 text-xs font-semibold text-accent-foreground hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">{activeCategory.name}<X className="h-3.5 w-3.5" aria-hidden="true" /></button>}
          {activeBrand && <button type="button" onClick={() => setSelectedBrand("")} className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-accent px-3 text-xs font-semibold text-accent-foreground hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">{activeBrand.name}<X className="h-3.5 w-3.5" aria-hidden="true" /></button>}
          <button type="button" onClick={clearFilters} className="min-h-8 px-2 text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">Limpiar todo</button>
        </div>}
      </div>

      <div className="flex items-start gap-7">
        <aside className="sticky top-36 hidden max-h-[calc(100vh-10rem)] w-64 shrink-0 overflow-hidden rounded-xl border border-border bg-card p-4 lg:block" aria-label="Filtros de productos"><FilterPanel /></aside>

        {filtersOpen && <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-labelledby="filters-title">
          <button type="button" className="absolute inset-0 bg-foreground/45" onClick={() => setFiltersOpen(false)} aria-label="Cerrar filtros" />
          <div className="absolute inset-y-0 right-0 flex w-[min(90vw,24rem)] flex-col bg-card shadow-2xl animate-slide-in-right">
            <div className="flex min-h-16 shrink-0 items-center justify-between border-b border-border px-5">
              <div><h2 id="filters-title" className="font-bold">Filtrar productos</h2><p className="text-xs text-muted-foreground">{filtered.length} resultados disponibles</p></div>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Cerrar filtros" className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><X className="h-5 w-5" /></button>
            </div>
            <div className="min-h-0 flex-1 p-5"><FilterPanel onApply={() => setFiltersOpen(false)} /></div>
          </div>
        </div>}

        <section className="min-w-0 flex-1" aria-live="polite" aria-busy={loadingProducts}>
          {loadingProducts ? <>
            <span className="sr-only">Cargando productos</span>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="overflow-hidden rounded-xl border border-border bg-card" aria-hidden="true"><div className="aspect-square animate-pulse bg-muted" /><div className="space-y-3 p-4"><div className="h-3 w-1/3 animate-pulse rounded bg-muted" /><div className="h-4 w-full animate-pulse rounded bg-muted" /><div className="h-10 w-full animate-pulse rounded bg-muted" /></div></div>)}</div>
          </> : loadError ? <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
            <h2 className="text-lg font-bold">No pudimos cargar el catálogo</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Intenta recargar la página. Si el problema continúa, te ayudamos a encontrar el producto por WhatsApp.</p>
            <a href="https://wa.me/573504609431" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-success px-5 text-sm font-bold text-success-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2"><MessageCircle className="h-4 w-4" />Hablar con un asesor</a>
          </div> : filtered.length > 0 ? <>
            <p className="mb-4 text-sm text-muted-foreground"><strong className="font-bold tabular-nums text-foreground">{filtered.length}</strong> {filtered.length === 1 ? "producto encontrado" : "productos encontrados"}</p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div>
          </> : <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
            <Search className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" /><h2 className="mt-4 text-lg font-bold">No encontramos productos</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Prueba con otra búsqueda o elimina alguno de los filtros activos.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3"><button type="button" onClick={clearFilters} className="inline-flex h-11 items-center rounded-lg border border-input bg-card px-5 text-sm font-bold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">Limpiar filtros</button><a href={`https://wa.me/573504609431?text=${encodeURIComponent(`Hola, busco: ${searchQuery || activeCategory?.name || activeBrand?.name || "un producto"}`)}`} data-wa-origen="tienda_sin_resultados" target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-lg bg-success px-5 text-sm font-bold text-success-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2"><MessageCircle className="h-4 w-4" />Preguntar por WhatsApp</a></div>
          </div>}
        </section>
      </div>
    </div>
  </>;
}
