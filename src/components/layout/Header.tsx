import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Menu, X, Phone, ChevronDown, ExternalLink } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useChat } from "@/contexts/ChatContext";

import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "@/assets/logo-netpower-it.png";

type SubCat = { label: string; q: string };
type ParentCat = { slug: string; label: string; categoria: string; subs: SubCat[] };

const categoryMenu: ParentCat[] = [
  { slug: "ups", label: "UPS", categoria: "ups-accesorios", subs: [
    { label: "Interactiva", q: "ups interactiva" },
    { label: "Online", q: "ups online" },
    { label: "PDU", q: "pdu" },
  ]},
  { slug: "servidores", label: "Servidores", categoria: "servidores", subs: [
    { label: "Torre", q: "servidor torre" },
    { label: "Rack", q: "servidor rack" },
  ]},
  { slug: "computo", label: "Cómputo", categoria: "monitores", subs: [
    { label: "PC de escritorio", q: "pc escritorio" },
    { label: "Portátiles", q: "portátil" },
    { label: "Workstation", q: "workstation" },
    { label: "Monitores", q: "monitor" },
  ]},
  { slug: "accesorios", label: "Accesorios", categoria: "accesorios", subs: [
    { label: "Cámaras", q: "cámara" },
    { label: "Teclados", q: "teclado" },
    { label: "Mouse", q: "mouse" },
    { label: "Discos Duros", q: "disco duro" },
    { label: "Diademas", q: "diadema" },
  ]},
  { slug: "licenciamiento", label: "Licenciamiento", categoria: "licencias", subs: [
    { label: "Microsoft", q: "microsoft" },
    { label: "Antivirus", q: "antivirus" },
  ]},
];

const navLinks = [
{ label: "Inicio", path: "/" },
{ label: "Tienda", path: "/tienda" },
{ label: "Blog", path: "/blog" },
{ label: "Quiénes Somos", path: "/nosotros" },
{ label: "Servicios IT", path: "https://avaconit.com/", external: true },
{ label: "Contacto", path: "/contacto" }];


export default function Header() {
  const { totalItems } = useCart();
  const { openChat } = useChat();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const catRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const goSearch = (term?: string) => {
    const t = (term ?? query).trim();
    if (!t) return;
    setShowResults(false);
    setSearchOpen(false);
    setQuery("");
    navigate(`/buscar?q=${encodeURIComponent(t)}`);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const term = `%${query}%`;
      const { data } = await supabase
        .from("products")
        .select("id, slug, name, price, sale_price, images, sku, brand, short_description")
        .eq("active", true)
        .or(`name.ilike.${term},sku.ilike.${term},brand.ilike.${term},short_description.ilike.${term}`)
        .limit(6);
      setResults(data || []);
      setShowResults(true);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-surface-dark">
        <div className="container mx-auto flex items-center justify-between py-2 px-6 text-xs text-surface-dark-foreground/80 font-medium">
          <span>Envío a todo Colombia · Garantía oficial · Soporte técnico</span>
          <a
            href="tel:+573018417896"
            className="hidden sm:flex items-center gap-1.5 font-bold text-base md:text-lg text-white hover:text-secondary transition-colors tracking-wide"
          >
            <Phone className="w-4 h-4" /> +57 301 841 7896
          </a>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-card border-b border-border/50 shadow-sm backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between h-20 px-6">
          {/* Logo — bigger */}
          <Link to="/" className="shrink-0">
            <img alt="Netpower IT" className="h-16 md:h-20 w-auto" src="/lovable-uploads/b211c203-2311-4faf-9578-ac0b9b07f1e0.png" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-7 ml-10">
            {navLinks.slice(0, 2).map((l) =>
            <Link
              key={l.label}
              to={l.path}
              className={`text-sm font-semibold tracking-wide transition hover:text-primary ${location.pathname === l.path ? "text-primary" : "text-foreground"}`}>
              
                {l.label}
              </Link>
            )}

            {/* Categories megadropdown */}
            <div ref={catRef} className="relative" onMouseEnter={() => setCatOpen(true)} onMouseLeave={() => setCatOpen(false)}>
              <button
                onClick={() => setCatOpen(!catOpen)}
                className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition py-2">
                Categorías <ChevronDown className={`w-3.5 h-3.5 transition-transform ${catOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {catOpen &&
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 w-[680px] bg-card rounded-xl shadow-elevated border border-border/60 p-4 z-50 grid grid-cols-5 gap-3">
                    {categoryMenu.map((parent) => (
                      <div key={parent.slug} className="flex flex-col">
                        <Link
                          to={`/categoria/${parent.categoria}`}
                          onClick={() => setCatOpen(false)}
                          className="text-sm font-bold text-foreground hover:text-primary transition pb-2 border-b border-border/40 mb-2"
                        >
                          {parent.label}
                        </Link>
                        <ul className="space-y-1">
                          {parent.subs.map((sub) => (
                            <li key={sub.label}>
                              <Link
                                to={`/buscar?q=${encodeURIComponent(sub.q)}`}
                                onClick={() => setCatOpen(false)}
                                className="block text-xs text-muted-foreground hover:text-primary transition py-1"
                              >
                                {sub.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </motion.div>
                }
              </AnimatePresence>
            </div>

            {navLinks.slice(2).map((l) =>
              l.external ? (
                <a
                  key={l.label}
                  href={l.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold tracking-wide transition hover:text-primary text-foreground flex items-center gap-1"
                >
                  {l.label}
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              ) : (
                <Link
                  key={l.label}
                  to={l.path}
                  className={`text-sm font-semibold tracking-wide transition hover:text-primary ${location.pathname === l.path ? "text-primary" : "text-foreground"}`}>
                  {l.label}
                </Link>
              )
            )}
          </nav>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <div ref={searchRef} className="relative w-full">
              <form onSubmit={(e) => { e.preventDefault(); goSearch(); }} className="relative">
                <button type="submit" aria-label="Buscar" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition">
                  <Search className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  placeholder="Buscar productos, marca, SKU..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") goSearch(); }}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
              </form>
              {showResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-xl shadow-elevated z-50 overflow-hidden">
                  {results.length > 0 ? (
                    <>
                      {results.map((product: any) => (
                        <Link
                          key={product.id}
                          to={`/producto/${product.slug}`}
                          onClick={() => { setShowResults(false); setQuery(""); }}
                          className="flex items-center gap-3 p-3 hover:bg-muted transition-colors border-b border-border/40 last:border-b-0"
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img src={product.images?.[0] || "/placeholder.svg"} alt={product.name} className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground line-clamp-1">{product.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {product.brand && <span className="text-xs text-muted-foreground">{product.brand}</span>}
                              {product.sku && <span className="text-xs text-muted-foreground font-mono">· {product.sku}</span>}
                            </div>
                            <p className="text-sm font-bold text-primary mt-0.5">
                              {product.sale_price
                                ? new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(product.sale_price)
                                : product.price
                                  ? new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(product.price)
                                  : "Consultar precio"}
                            </p>
                          </div>
                        </Link>
                      ))}
                      <button
                        onClick={() => goSearch()}
                        className="block w-full text-center text-sm text-primary font-semibold py-3 border-t border-border hover:bg-muted transition-colors"
                      >
                        Ver todos los resultados para "{query}" →
                      </button>
                    </>
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">No encontramos productos para "{query}"</p>
                      <button onClick={() => goSearch()} className="text-xs text-primary font-semibold mt-2 hover:underline">Buscar de todas formas →</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button onClick={() => openChat("quote")} className="hidden sm:inline-flex h-10 px-6 items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-button">
              Cotizar Proyecto
            </button>

            <button onClick={() => setSearchOpen(!searchOpen)} aria-label={searchOpen ? "Cerrar búsqueda" : "Abrir búsqueda"} className="md:hidden p-2 text-foreground hover:text-primary transition">
              <Search className="w-5 h-5" />
            </button>

            <Link to="/carrito" aria-label={`Carrito de compras${totalItems > 0 ? ` (${totalItems} artículos)` : ""}`} className="relative p-2 text-foreground hover:text-primary transition">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 &&
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              }
            </Link>

            <button onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"} className="lg:hidden p-2 text-foreground hover:text-primary transition">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen &&
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="lg:hidden border-b border-border overflow-hidden bg-card">
          
            <nav className="flex flex-col p-5 gap-1">
              {navLinks.map((l) =>
                l.external ? (
                  <a key={l.label} href={l.path} target="_blank" rel="noopener noreferrer" className="py-3 px-4 rounded-lg text-sm font-medium transition text-foreground hover:bg-muted flex items-center gap-1">
                    {l.label}
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                ) : (
                  <Link
                    key={l.label}
                    to={l.path}
                    className={`py-3 px-4 rounded-lg text-sm font-medium transition ${location.pathname === l.path ? "text-primary bg-accent" : "text-foreground hover:bg-muted"}`}>
                    {l.label}
                  </Link>
                )
            )}
              <div className="pl-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Categorías</p>
                {categoryMenu.map((parent) => (
                  <div key={parent.slug} className="mb-3">
                    <Link
                      to={`/categoria/${parent.categoria}`}
                      className="block py-1.5 text-sm font-bold text-foreground hover:text-primary transition"
                    >
                      {parent.label}
                    </Link>
                    <ul className="pl-3 border-l border-border/40 mt-1">
                      {parent.subs.map((sub) => (
                        <li key={sub.label}>
                          <Link
                            to={`/buscar?q=${encodeURIComponent(sub.q)}`}
                            className="block py-1 text-xs text-muted-foreground hover:text-primary transition"
                          >
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <a href="tel:+573018417896" className="py-3 px-4 flex items-center gap-2 text-sm text-secondary font-medium">
                <Phone className="w-4 h-4" /> +57 301 841 7896
              </a>
              <button
              onClick={() => openChat("quote")}
              className="mt-2 py-3 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold text-center w-full">
              
                Cotizar Proyecto
              </button>
            </nav>
          </motion.div>
        }
      </AnimatePresence>

      {/* Mobile search */}
      <AnimatePresence>
        {searchOpen &&
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="md:hidden border-b border-border overflow-hidden bg-card p-4">
          
            <form onSubmit={(e) => { e.preventDefault(); goSearch(); }} className="relative">
              <button type="submit" aria-label="Buscar" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="w-4 h-4" />
              </button>
              <input
              type="text"
              placeholder="Buscar productos, marca, SKU..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </form>
          </motion.div>
        }
      </AnimatePresence>
    </header>);

}