import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Search, Menu, X, Phone, ChevronDown } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { products, categories } from "@/data/store-data";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "@/assets/logo-netpower-it.png";

const menuCategories = categories.filter(c => c.slug !== "servidores");

const navLinks = [
  { label: "Inicio", to: "/" },
  { label: "Tienda", to: "/tienda" },
  { label: "Marcas", to: "/marcas" },
  { label: "Cotizaciones", to: "/cotizacion" },
  { label: "Contacto", to: "/contacto" },
];

export default function Header() {
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const location = useLocation();
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const filtered = searchQuery.length > 1
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar - teal */}
      <div className="bg-primary">
        <div className="container mx-auto flex items-center justify-between py-1.5 px-4 text-xs text-primary-foreground font-medium">
          <span>Envío a todo Colombia · Garantía oficial · Soporte técnico</span>
          <a href="tel:+573018417895" className="hidden sm:flex items-center gap-1 text-primary-foreground/90 hover:text-primary-foreground transition">
            <Phone className="w-3 h-3" /> +57 301 841 7895
          </a>
        </div>
      </div>

      {/* Main header - white bg for contrast */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          {/* Logo */}
        <Link to="/" className="shrink-0">
          <img src={logoImg} alt="Netpower IT" className="h-12 md:h-14 w-auto" />
        </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6 ml-8">
            {navLinks.slice(0, 2).map(l => (
              <Link
                key={l.label}
                to={l.to}
                className={`text-sm font-semibold transition hover:text-primary ${location.pathname === l.to ? "text-primary" : "text-foreground"}`}
              >
                {l.label}
              </Link>
            ))}

            {/* Categories dropdown */}
            <div ref={catRef} className="relative">
              <button
                onClick={() => setCatOpen(!catOpen)}
                className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition"
              >
                Categorías <ChevronDown className={`w-3.5 h-3.5 transition-transform ${catOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {catOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full mt-3 left-0 w-60 bg-card rounded-xl shadow-lg border border-border py-2 z-50"
                  >
                    {menuCategories.map(c => (
                      <Link
                        key={c.id}
                        to={`/tienda?categoria=${c.slug}`}
                        onClick={() => setCatOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition"
                      >
                        <span className="text-lg">{c.icon}</span> {c.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {navLinks.slice(2).map(l => (
              <Link
                key={l.label}
                to={l.to}
                className={`text-sm font-semibold transition hover:text-primary ${location.pathname === l.to ? "text-primary" : "text-foreground"}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-sm mx-6 relative">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-10 pr-4 rounded-lg border border-border bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>
            {filtered.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-card rounded-xl shadow-lg border border-border overflow-hidden z-50">
                {filtered.map(p => (
                  <Link
                    key={p.id}
                    to={`/producto/${p.slug}`}
                    onClick={() => setSearchQuery("")}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.shortDesc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link to="/cotizacion" className="hidden sm:inline-flex h-9 px-5 items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all">
              Cotizar Proyecto
            </Link>

            <button onClick={() => setSearchOpen(!searchOpen)} className="md:hidden p-2 text-foreground hover:text-primary transition">
              <Search className="w-5 h-5" />
            </button>

            <Link to="/carrito" className="relative p-2 text-foreground hover:text-primary transition">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-foreground hover:text-primary transition">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-b border-border overflow-hidden bg-card"
          >
            <nav className="flex flex-col p-4 gap-1">
              {navLinks.map(l => (
                <Link
                  key={l.label}
                  to={l.to}
                  className={`py-2.5 px-3 rounded-lg text-sm font-medium transition ${location.pathname === l.to ? "text-primary bg-accent" : "text-foreground hover:bg-muted"}`}
                >
                  {l.label}
                </Link>
              ))}
              <div className="pl-3 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Categorías</p>
                {menuCategories.map(c => (
                  <Link
                    key={c.id}
                    to={`/tienda?categoria=${c.slug}`}
                    className="block py-2 text-sm text-muted-foreground hover:text-primary transition"
                  >
                    {c.icon} {c.name}
                  </Link>
                ))}
              </div>
              <a href="tel:+573018417895" className="py-2.5 px-3 flex items-center gap-2 text-sm text-secondary font-medium">
                <Phone className="w-4 h-4" /> +57 301 841 7895
              </a>
              <Link
                to="/cotizacion"
                className="mt-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold text-center"
              >
                Cotizar Proyecto
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile search */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-b border-border overflow-hidden bg-card p-4"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-muted/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
