import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/store/ProductCard";

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [input, setInput] = useState(q);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const term = `%${q}%`;
    supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .or(`name.ilike.${term},sku.ilike.${term},brand.ilike.${term},short_description.ilike.${term}`)
      .limit(60)
      .then(({ data }) => {
        const mapped = (data || []).map((r: any) => ({
          id: r.id, slug: r.slug, name: r.name, description: r.description ?? "",
          shortDesc: r.short_description ?? "", price: Number(r.price),
          salePrice: r.sale_price ? Number(r.sale_price) : null,
          sku: r.sku ?? "", stock: r.stock ?? 0, images: r.images ?? [],
          categoryId: r.category ?? "", brandId: r.brand ?? "",
          specs: r.specs ?? {}, metaTitle: "", metaDesc: "", active: true, featured: false,
        }));
        setResults(mapped);
        setLoading(false);
      });
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams({ q: input });
  };

  return (
    <>
      <Helmet>
        <title>{q ? `Buscar: ${q}` : "Buscar"} — Netpower IT</title>
      </Helmet>
      <div className="container mx-auto px-4 py-8">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Inicio</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Buscar</span>
        </nav>

        <form onSubmit={submit} className="relative max-w-2xl mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Buscar productos por nombre, marca o SKU…"
            className="w-full h-12 pl-12 pr-32 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/30"
            autoFocus
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
            Buscar
          </button>
        </form>

        {q && (
          <p className="text-sm text-muted-foreground mb-4">
            {loading ? "Buscando…" : `${results.length} resultados para "${q}"`}
          </p>
        )}

        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {results.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : q && !loading ? (
          <div className="text-center py-16">
            <p className="text-lg font-semibold text-foreground mb-2">Sin resultados</p>
            <p className="text-sm text-muted-foreground mb-4">Intenta con otro término o consulta por WhatsApp</p>
            <a
              href={`https://wa.me/573018417895?text=${encodeURIComponent(`Hola, busco: ${q}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex h-10 px-5 items-center rounded-lg bg-success text-success-foreground text-sm font-semibold"
            >
              Preguntar por WhatsApp
            </a>
          </div>
        ) : null}
      </div>
    </>
  );
}
