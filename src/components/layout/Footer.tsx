import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { categories, brands } from "@/data/store-data";
import logoImg from "@/assets/logo-netpower-it.png";

const footerCategories = categories.filter(c => c.slug !== "servidores");

export default function Footer() {
  return (
    <footer className="bg-surface-dark text-surface-dark-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <img src={logoImg} alt="Netpower IT" className="h-10 w-auto brightness-0 invert" />
            </Link>
            <p className="text-sm text-surface-dark-foreground/60 leading-relaxed mb-4">
              Tu proveedor #1 de tecnología TIC en Colombia. Distribuidores autorizados con garantía y soporte técnico.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-surface-dark-foreground/80">Categorías</h3>
            <ul className="space-y-2">
              {footerCategories.map(c => (
                <li key={c.id}>
                  <Link to={`/tienda?categoria=${c.slug}`} className="text-sm text-surface-dark-foreground/60 hover:text-primary transition">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-surface-dark-foreground/80">Contacto</h3>
            <div className="flex flex-col gap-3 text-sm text-surface-dark-foreground/60">
              <span className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" /> Bogotá, Colombia · Servicio en toda Colombia e internacional
              </span>
              <a href="tel:+573018417895" className="flex items-center gap-2 hover:text-primary transition">
                <Phone className="w-4 h-4 text-primary shrink-0" /> +57 301 841 7895
              </a>
              <a href="mailto:aosorio@netpowerit.co" className="flex items-center gap-2 hover:text-primary transition">
                <Mail className="w-4 h-4 text-primary shrink-0" /> aosorio@netpowerit.co
              </a>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary shrink-0" /> Lun-Vie 8am-6pm | Sáb 9am-1pm
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-surface-dark-foreground/80">Empresa</h3>
            <ul className="space-y-2 mb-6">
              <li><Link to="/nosotros" className="text-sm text-surface-dark-foreground/60 hover:text-primary transition">Quiénes somos</Link></li>
              <li><Link to="/contacto" className="text-sm text-surface-dark-foreground/60 hover:text-primary transition">Contacto</Link></li>
              <li><Link to="/cotizacion" className="text-sm text-surface-dark-foreground/60 hover:text-primary transition">Cotizaciones</Link></li>
              <li><Link to="/tienda" className="text-sm text-surface-dark-foreground/60 hover:text-primary transition">Tienda</Link></li>
              <li><Link to="/marcas" className="text-sm text-surface-dark-foreground/60 hover:text-primary transition">Marcas</Link></li>
              <Link to="/legal">Términos y Condiciones</Link>
<Link to="/legal">Política de Cookies</Link>
<Link to="/legal">Tratamiento de Datos</Link>
            </ul>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-3 text-surface-dark-foreground/80">Marcas</h3>
            <div className="flex flex-wrap gap-1.5">
              {brands.slice(0, 10).map(b => (
                <Link key={b.id} to={`/tienda?marca=${b.slug}`} className="text-[11px] px-2 py-0.5 rounded-full bg-surface-dark-foreground/10 text-surface-dark-foreground/50 hover:bg-primary hover:text-primary-foreground transition">
                  {b.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-surface-dark-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-surface-dark-foreground/40">
            © {new Date().getFullYear()} Netpower IT. Todos los derechos reservados.
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
