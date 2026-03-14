import { Link } from "react-router-dom";
import { Zap, Mail, Phone, MapPin } from "lucide-react";
import { categories, brands } from "@/data/store-data";

export default function Footer() {
  return (
    <footer className="bg-surface-dark text-surface-dark-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 font-extrabold text-xl mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span>Net<span className="text-primary">Power</span> IT</span>
            </Link>
            <p className="text-sm text-surface-dark-foreground/60 leading-relaxed mb-4">
              Tu proveedor #1 de tecnología TIC en Colombia. Distribuidores autorizados con garantía y soporte técnico.
            </p>
            <div className="flex flex-col gap-2 text-sm text-surface-dark-foreground/60">
              <a href="mailto:info@netpowerit.co" className="flex items-center gap-2 hover:text-primary transition">
                <Mail className="w-4 h-4" /> info@netpowerit.co
              </a>
              <a href="tel:+573001234567" className="flex items-center gap-2 hover:text-primary transition">
                <Phone className="w-4 h-4" /> +57 300 123 4567
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Colombia
              </span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-surface-dark-foreground/80">Categorías</h3>
            <ul className="space-y-2">
              {categories.slice(0, 6).map(c => (
                <li key={c.id}>
                  <Link to={`/tienda?categoria=${c.slug}`} className="text-sm text-surface-dark-foreground/60 hover:text-primary transition">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-surface-dark-foreground/80">Empresa</h3>
            <ul className="space-y-2">
              <li><Link to="/nosotros" className="text-sm text-surface-dark-foreground/60 hover:text-primary transition">Quiénes somos</Link></li>
              <li><Link to="/contacto" className="text-sm text-surface-dark-foreground/60 hover:text-primary transition">Contacto</Link></li>
              <li><Link to="/cotizacion" className="text-sm text-surface-dark-foreground/60 hover:text-primary transition">Cotizaciones</Link></li>
              <li><Link to="/tienda" className="text-sm text-surface-dark-foreground/60 hover:text-primary transition">Tienda</Link></li>
            </ul>
          </div>

          {/* Brands */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-surface-dark-foreground/80">Marcas</h3>
            <div className="flex flex-wrap gap-2">
              {brands.slice(0, 10).map(b => (
                <span key={b.id} className="text-xs px-2.5 py-1 rounded-full bg-surface-dark-foreground/10 text-surface-dark-foreground/60">
                  {b.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-surface-dark-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-surface-dark-foreground/40">
            © {new Date().getFullYear()} NetPower IT. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 text-xs text-surface-dark-foreground/40">
            <span>Pagos seguros con Wompi</span>
            <span>•</span>
            <span>Garantía oficial</span>
            <span>•</span>
            <span>Facturación electrónica</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
