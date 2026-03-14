import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Truck, Headphones, FileText, Star, CheckCircle } from "lucide-react";
import { categories, brands, products } from "@/data/store-data";
import ProductCard from "@/components/store/ProductCard";
import heroBanner from "@/assets/hero-banner.jpg";
import ctaBanner from "@/assets/cta-banner.jpg";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

export default function HomePage() {
  const featured = products.filter(p => p.featured);

  return (
    <>
      <Helmet>
        <title>Netpower IT – Tu Proveedor #1 de Tecnología TIC en Colombia</title>
        <meta name="description" content="UPS, baterías, servidores, infraestructura de red, energía solar y licencias con garantía oficial. Envío a todo Colombia. Cotiza tu proyecto TIC." />
        <meta property="og:title" content="Netpower IT – Tecnología TIC en Colombia" />
        <meta property="og:description" content="Tu proveedor #1 de UPS, servidores, infraestructura y energía solar en Colombia" />
        <link rel="canonical" href="https://netpowerit.co" />
      </Helmet>

      {/* Hero with banner image */}
      <section className="relative overflow-hidden min-h-[520px] flex items-center">
        <img src={heroBanner} alt="Tecnología TIC" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(0,0%,13%)/0.92] via-[hsl(0,0%,13%)/0.75] to-transparent" />
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
            className="max-w-2xl"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary text-xs font-semibold mb-6">
              <CheckCircle className="w-3.5 h-3.5" /> Distribuidores autorizados en Colombia
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[hsl(0,0%,100%)] leading-[1.1] mb-5">
              Tu proveedor <span className="text-primary">#1</span> de tecnología TIC en Colombia
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-[hsl(0,0%,100%)/0.75] mb-8 max-w-lg">
              UPS, servidores, infraestructura y energía solar con garantía oficial y soporte técnico especializado.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              <Link to="/tienda" className="inline-flex h-12 px-8 items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold shadow-button hover:opacity-90 transition-all">
                Ver Tienda <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/cotizacion" className="inline-flex h-12 px-8 items-center gap-2 rounded-lg border-2 border-[hsl(0,0%,100%)/0.3] text-[hsl(0,0%,100%)] font-semibold hover:bg-[hsl(0,0%,100%)/0.1] backdrop-blur-sm transition">
                Solicitar Cotización
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-x-6 gap-y-2 mt-10 text-xs text-[hsl(0,0%,100%)/0.65] font-medium">
              <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Envío a todo Colombia</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Garantía oficial</span>
              <span className="flex items-center gap-1.5"><Headphones className="w-3.5 h-3.5" /> Soporte técnico</span>
              <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Facturación electrónica</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">Nuestras Categorías</h2>
            <p className="text-muted-foreground mt-2">Encuentra todo lo que necesitas para tu infraestructura TIC</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <motion.div key={cat.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.05 }}>
                <Link to={`/tienda?categoria=${cat.slug}`} className="group flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all">
                  <span className="text-4xl mb-3">{cat.icon}</span>
                  <h3 className="font-semibold text-sm text-card-foreground group-hover:text-primary transition">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{cat.productCount} productos</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">Productos Destacados</h2>
              <p className="text-muted-foreground mt-2">Los más vendidos con las mejores ofertas</p>
            </div>
            <Link to="/tienda" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {featured.slice(0, 8).map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner with image */}
      <section className="relative py-20 overflow-hidden">
        <img src={ctaBanner} alt="Cotización empresarial" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[hsl(0,0%,13%)/0.85]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[hsl(0,0%,100%)] mb-3">¿Necesitas cotización empresarial?</h2>
          <p className="text-[hsl(0,0%,100%)/0.7] mb-8 max-w-lg mx-auto">Nuestro equipo te asesora con soluciones a la medida para tu proyecto TIC</p>
          <Link to="/cotizacion" className="inline-flex h-12 px-8 items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold shadow-button hover:opacity-90 transition-all">
            Solicitar Cotización <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Brands */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl md:text-3xl font-extrabold text-foreground mb-10">Marcas que Distribuimos</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {brands.map(b => (
              <Link
                key={b.id}
                to={`/tienda?marca=${b.slug}`}
                className="px-6 py-4 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover hover:border-primary/40 transition-all flex items-center justify-center min-w-[120px] group"
              >
                <span className="font-bold text-sm text-muted-foreground group-hover:text-primary transition">{b.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl md:text-3xl font-extrabold text-foreground mb-10">¿Por qué Elegirnos?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: ShieldCheck, label: "Distribuidores autorizados" },
              { icon: ShieldCheck, label: "Garantía de fábrica" },
              { icon: Headphones, label: "Soporte técnico especializado" },
              { icon: Truck, label: "Envío a todo Colombia" },
              { icon: FileText, label: "Facturación electrónica" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6 rounded-xl bg-background border border-border shadow-card hover:shadow-card-hover transition-all">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-3">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold text-sm text-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl md:text-3xl font-extrabold text-foreground mb-10">Lo que Dicen Nuestros Clientes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Carlos Gómez", company: "TechSolutions SAS, Bogotá", text: "Excelente servicio y rapidez en la entrega. Los UPS APC que compramos funcionan perfecto." },
              { name: "María Rodríguez", company: "Hospital San José, Medellín", text: "El equipo de Netpower IT nos asesoró con la solución de energía ideal para nuestro centro de datos." },
              { name: "Andrés López", company: "Grupo Empresarial ALR, Cali", text: "Precios competitivos y garantía oficial. Llevamos 3 años comprando con ellos sin problemas." },
            ].map((t, i) => (
              <div key={i} className="p-6 rounded-xl bg-card border border-border shadow-card">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-secondary fill-secondary" />)}
                </div>
                <p className="text-sm text-muted-foreground mb-4 italic leading-relaxed">"{t.text}"</p>
                <p className="font-semibold text-sm text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.company}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-surface-dark">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-surface-dark-foreground mb-3">¿Proyecto grande? Obtén precios especiales</h2>
          <p className="text-surface-dark-foreground/60 mb-8 max-w-lg mx-auto">Cotizamos proyectos de infraestructura TIC, energía solar y más a nivel empresarial</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/cotizacion" className="inline-flex h-12 px-8 items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold shadow-button hover:opacity-90 transition-all">
              Obtener Cotización <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.me/573018417895?text=Hola,%20necesito%20cotizar%20un%20proyecto%20empresarial"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 px-8 items-center gap-2 rounded-lg border border-surface-dark-foreground/30 text-surface-dark-foreground font-semibold hover:bg-surface-dark-foreground/10 transition"
            >
              Chatear por WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
