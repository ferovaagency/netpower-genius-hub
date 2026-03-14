import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { brands } from "@/data/store-data";

export default function BrandsPage() {
  return (
    <>
      <Helmet>
        <title>Marcas – Distribuidores Autorizados | Netpower IT</title>
        <meta name="description" content="Somos distribuidores autorizados de APC, HP, Samsung, Logitech, Dahua, Hikvision y más. Productos con garantía oficial en Colombia." />
        <link rel="canonical" href="https://netpowerit.co/marcas" />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition">Inicio</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Marcas</span>
        </nav>

        <div className="text-center mb-12">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">Marcas que Distribuimos</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">Somos distribuidores autorizados con garantía oficial del fabricante en toda Colombia</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {brands.map(b => (
            <Link
              key={b.id}
              to={`/tienda?marca=${b.slug}`}
              className="group flex flex-col items-center justify-center p-6 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover hover:border-primary/40 transition-all min-h-[120px]"
            >
              <span className="text-lg font-bold text-muted-foreground group-hover:text-primary transition">{b.name}</span>
              <span className="text-xs text-muted-foreground mt-1">Ver productos →</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
