import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Truck, Headphones, FileText, Star, CheckCircle } from "lucide-react";
import { categories, brands, products } from "@/data/store-data";
import { supabase } from "@/integrations/supabase/client";
import { useChat } from "@/contexts/ChatContext";
import ProductCard from "@/components/store/ProductCard";
import { getParentCategory } from "@/lib/catalog";
import heroBanner from "@/assets/hero-banner.jpg";
import ctaBanner from "@/assets/cta-banner.jpg";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function HomePage() {
  const { openChat } = useChat();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    Object.fromEntries(categories.map((category) => [category.name, category.productCount])),
  );

  useEffect(() => {
    let cancelled = false;

    const loadCategoryCounts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("category, active")
        .eq("active", true);

      if (error || !data || cancelled) return;

      const nextCounts = Object.fromEntries(categories.map((category) => [category.name, 0])) as Record<string, number>;

      data.forEach((product) => {
        const normalizedCategory = getParentCategory(product.category);
        nextCounts[normalizedCategory] = (nextCounts[normalizedCategory] ?? 0) + 1;
      });

      setCategoryCounts(nextCounts);
    };

    void loadCategoryCounts();

    return () => {
      cancelled = true;
    };
  }, []);

  const categoriesWithCounts = categories.map((category) => ({
    ...category,
    productCount: categoryCounts[category.name] ?? 0,
  }));

  return (
    <>
      <Helmet>
        <title>Netpower IT – Tu Proveedor #1 de Tecnología TIC en Colombia</title>
        <meta name="description" content="UPS, baterías, servidores, infraestructura de red, energía solar y licencias con garantía oficial. Envío a todo Colombia. Cotiza tu proyecto TIC." />
        <meta property="og:title" content="Netpower IT – Tecnología TIC en Colombia" />
        <meta property="og:description" content="Tu proveedor #1 de UPS, servidores, infraestructura y energía solar en Colombia" />
        <link rel="canonical" href="https://netpowerit.co" />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[480px] flex items-center">
        <img src={heroBanner} alt="Tecnología TIC" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-dark/95 via-surface-dark/70 to-transparent" />
        <div className="container mx-auto px-6 py-20 md:py-24 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="max-w-xl">
            
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 backdrop-blur-sm border border-primary/25 text-primary text-xs font-semibold mb-5">
              <CheckCircle className="w-3 h-3" /> Distribuidores autorizados
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-card leading-tight mb-4">
              Tu proveedor <span className="text-primary">#1</span> de tecnología TIC
            </motion.h1>
            <motion.p variants={fadeUp} className="text-base text-card/70 mb-7 max-w-md leading-relaxed">
              UPS, servidores, infraestructura y energía solar con garantía oficial y soporte técnico.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              <Link to="/tienda" className="inline-flex h-11 px-7 items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold shadow-button hover:opacity-90 transition-all text-sm">
                Ver Tienda <ArrowRight className="w-4 h-4" />
              </Link>
              <button onClick={() => openChat("quote")} className="inline-flex h-11 px-7 items-center gap-2 rounded-lg border border-card/25 text-card font-semibold hover:bg-card/10 backdrop-blur-sm transition text-sm">
                Solicitar Cotización
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-card border-b border-border/50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-primary" /> Envío a todo Colombia</span>
            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Garantía oficial</span>
            <span className="flex items-center gap-2"><Headphones className="w-4 h-4 text-primary" /> Soporte técnico</span>
            <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Facturación electrónica</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-14 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">Categorías</h2>
            <p className="text-muted-foreground mt-2 text-sm">Todo para tu infraestructura TIC</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categoriesWithCounts.map((cat, i) =>
            <motion.div key={cat.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.04 }}>
                <Link to={`/tienda?categoria=${cat.slug}`} className="group flex items-center gap-3 p-4 rounded-xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-card-hover transition-all">
                  <span className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-primary shrink-0">
                    {cat.lucideIcon}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-card-foreground group-hover:text-primary transition truncate">{cat.name}</h3>
                    <p className="text-muted-foreground text-base">{cat.productCount} productos</p>
                  </div>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-14 bg-card">
        <div className="container mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">Productos Destacados</h2>
              <p className="text-muted-foreground mt-1.5 text-base">Los más vendidos con las mejores ofertas</p>
            </div>
            <Link to="/tienda" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {featured.slice(0, 8).map((p) =>
            <ProductCard key={p.id} product={p} />
            )}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-16 overflow-hidden">
        <img src={ctaBanner} alt="Cotización empresarial" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-surface-dark/85" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-card mb-3">¿Necesitas cotización empresarial?</h2>
          <p className="text-card/65 mb-7 max-w-md mx-auto text-sm">Nuestro equipo te asesora con soluciones a la medida para tu proyecto TIC</p>
          <button onClick={() => openChat("quote")} className="inline-flex h-11 px-7 items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold shadow-button hover:opacity-90 transition-all text-sm">
            Solicitar Cotización <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Brands */}
      <section className="py-14 bg-background">
        <div className="container mx-auto px-6">
          <h2 className="text-center text-2xl md:text-3xl font-extrabold text-foreground mb-8">Marcas que Distribuimos</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {brands.map((b) =>
            <Link
              key={b.id}
              to={`/tienda?marca=${b.slug}`}
              className="px-5 py-3 rounded-lg bg-card border border-border/60 hover:border-primary/40 hover:shadow-card-hover transition-all flex items-center justify-center group">
              
                <span className="font-bold text-xs text-muted-foreground group-hover:text-primary transition tracking-wide uppercase">{b.name}</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-14 bg-card">
        <div className="container mx-auto px-6">
          <h2 className="text-center text-2xl md:text-3xl font-extrabold text-foreground mb-8">Lo que Dicen Nuestros Clientes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
            { name: "Carlos Gómez", company: "TechSolutions SAS, Bogotá", text: "Excelente servicio y rapidez en la entrega. Los UPS APC que compramos funcionan perfecto." },
            { name: "María Rodríguez", company: "Hospital San José, Medellín", text: "El equipo de Netpower IT nos asesoró con la solución de energía ideal para nuestro centro de datos." },
            { name: "Andrés López", company: "Grupo Empresarial ALR, Cali", text: "Precios competitivos y garantía oficial. Llevamos 3 años comprando con ellos sin problemas." }].
            map((t, i) =>
            <div key={i} className="p-5 rounded-xl bg-background border border-border/60">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-secondary fill-secondary" />)}
                </div>
                <p className="text-sm text-muted-foreground mb-4 italic leading-relaxed">"{t.text}"</p>
                <p className="font-semibold text-sm text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.company}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-14 bg-surface-dark">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-surface-dark-foreground mb-3">¿Proyecto grande? Obtén precios especiales</h2>
          <p className="text-surface-dark-foreground/55 mb-7 max-w-md mx-auto text-sm">Cotizamos proyectos de infraestructura TIC, energía solar y más a nivel empresarial</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => openChat("quote")} className="inline-flex h-11 px-7 items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold shadow-button hover:opacity-90 transition-all text-sm">
              Obtener Cotización <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="https://wa.me/573018417895?text=Hola,%20necesito%20cotizar%20un%20proyecto%20empresarial"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 px-7 items-center gap-2 rounded-lg border border-surface-dark-foreground/25 text-surface-dark-foreground font-semibold hover:bg-surface-dark-foreground/10 transition text-sm">
              
              Chatear por WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>);

}
