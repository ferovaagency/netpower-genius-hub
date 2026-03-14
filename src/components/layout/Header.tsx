import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Search, Menu, X, Zap } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { products } from "@/data/store-data";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Inicio", to: "/" },
  { label: "Tienda", to: "/tienda" },
  { label: "Categorías", to: "/tienda" },
  { label: "Contacto", to: "/contacto" },
];

export default function Header() {
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  const filtered = searchQuery.length > 1
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      {/* Top bar */}
      <div className="bg-gradient-hero">
        <div className="container mx-auto flex items-center justify-center py-1.5 text-xs text-primary-foreground/90 font-medium">
          <Zap className="w-3 h-3 mr-1" />
          Envío a todo Colombia · Garantía oficial · Soporte técnico especializado
        </div>
      </div>

      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-extrabold text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-foreground">Net<span className="text-primary">Power</span> IT</span>
        </Link>

        {/* Desktop Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-full border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>
          {filtered.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-card rounded-xl shadow-card-hover border border-border overflow-hidden z-50">
              {filtered.map(p => (
                <Link
                  key={p.id}
                  to={`/producto/${p.slug}`}
                  onClick={() => setSearchQuery("")}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition text-sm"
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs font-mono text-muted-foreground">
                    {p.sku.slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.shortDesc}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map(l => (
            <Link
              key={l.to + l.label}
              to={l.to}
              className={`text-sm font-medium transition hover:text-primary ${location.pathname === l.to ? "text-primary" : "text-muted-foreground"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link to="/cotizacion" className="hidden sm:inline-flex h-9 px-4 items-center gap-1.5 rounded-full bg-gradient-secondary text-secondary-foreground text-sm font-semibold shadow-button hover:shadow-lg transition-all hover:scale-[1.02]">
            Cotizar Proyecto
          </Link>

          <button onClick={() => setSearchOpen(!searchOpen)} className="md:hidden p-2 text-muted-foreground hover:text-foreground transition">
            <Search className="w-5 h-5" />
          </button>

          <Link to="/carrito" className="relative p-2 text-muted-foreground hover:text-foreground transition">
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-border overflow-hidden bg-card"
          >
            <nav className="flex flex-col p-4 gap-2">
              {navLinks.map(l => (
                <Link
                  key={l.to + l.label}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className="py-2 px-3 rounded-lg text-sm font-medium hover:bg-accent transition"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                to="/cotizacion"
                onClick={() => setMobileOpen(false)}
                className="mt-2 py-2.5 px-4 rounded-full bg-gradient-secondary text-secondary-foreground text-sm font-semibold text-center shadow-button"
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
            className="md:hidden border-t border-border overflow-hidden bg-card p-4"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full h-10 pl-10 pr-4 rounded-full border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
