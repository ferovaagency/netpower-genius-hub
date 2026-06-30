import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Truck, Headphones, FileText, Star, CheckCircle } from "lucide-react";
import { categories, products } from "@/data/store-data";
import { supabase } from "@/integrations/supabase/client";
import { useChat } from "@/contexts/ChatContext";
import ProductCard from "@/components/store/ProductCard";
import { getParentCategory } from "@/lib/catalog";
import SeoHead from "@/components/SeoHead";
import TrustBadges from "@/components/TrustBadges";
import heroBanner from "@/assets/hero-banner.jpg";
import ctaBanner from "@/assets/cta-banner.jpg";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

type SlideCTA =
  | { type: "link"; label: string; to: string }
  | { type: "chat"; label: string; mode: "general" | "quote" };

type Slide = {
  image: string;
  badge: string | null;
  titleParts: [string, string, string]; // before, highlight (text-primary), after
  subtitle: string;
  cta: SlideCTA;
};

const slides: Slide[] = [
  {
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&q=80",
    badge: null,
    titleParts: ["Ya está aquí la nueva generación de ", "servidores HPE Gen12", ""],
    subtitle: "Mayor rendimiento y seguridad para tu infraestructura. Respaldo certificado: garantía directa con las marcas que nos respaldan. +120 empresas confían en nosotros.",
    cta: { type: "link", label: "Ver Tienda", to: "/tienda" },
  },
  {
    image: heroBanner,
    badge: null,
    titleParts: ["Protegemos la energía de tu empresa para que tu operación ", "nunca se detenga", "."],
    subtitle: "UPS, servidores e infraestructura con garantía oficial. Las marcas nos respaldan y certifican. +120 empresas confían en nosotros.",
    cta: { type: "chat", label: "Solicitar Cotización", mode: "quote" },
  },
  {
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&q=80",
    badge: "PRODUCTO DEL MES",
    titleParts: ["Tu compra con ", "respaldo certificado", ""],
    subtitle: "Garantía directa con las marcas que nos respaldan y certifican. +120 empresas confían en nosotros.",
    cta: { type: "link", label: "Ver Tienda", to: "/tienda" },
  },
];

export default function HomePage() {
  const { openChat } = useChat();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [homeBrands, setHomeBrands] = useState<{ id: string; slug: string; name: string; logo_url: string | null }[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    Object.fromEntries(categories.map((category) => [category.name, category.productCount])),
  );

  useEffect(() => {
    supabase
      .from("brands" as any)
      .select("id, slug, name, logo_url")
      .eq("show_in_home", true)
      .order("display_order", { ascending: true })
      .then(({ data }) => setHomeBrands((data as any) || []));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (error || !data || cancelled) return;

      const nextCounts = Object.fromEntries(categories.map((category) => [category.name, 0])) as Record<string, number>;

      data.forEach((product) => {
        const normalizedCategory = getParentCategory(product.category);
        nextCounts[normalizedCategory] = (nextCounts[normalizedCategory] ?? 0) + 1;
      });

      setCategoryCounts(nextCounts);

      // Destacados: primero los marcados como `featured`, luego rellenamos
      // con los más recientes hasta completar 8.
      const featuredFirst = data.filter((r: any) => r.featured === true);
      const rest = data.filter((r: any) => r.featured !== true);
      const ordered = [...featuredFirst, ...rest].slice(0, 8);

      setFeaturedProducts(ordered.map((r: any) => ({
        id: r.id, slug: r.slug, name: r.name, description: r.description ?? "",
        shortDesc: r.short_description ?? "", price: Number(r.price),
        salePrice: r.sale_price ? Number(r.sale_price) : null,
        sku: r.sku ?? "", stock: r.stock ?? 0, images: r.images ?? [],
        categoryId: r.category ?? "", brandId: r.brand ?? "",
        specs: r.specs ?? {}, metaTitle: r.meta_title ?? "", metaDesc: r.meta_description ?? "",
        active: true, featured: r.featured ?? false,
      })));
    };

    void loadProducts();

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
      <SeoHead
        title="Netpower IT – UPS, Servidores y Soluciones TIC en Colombia"
        description="Compra UPS, baterías, servidores HPE, infraestructura de red y energía solar con garantía oficial. Envío a toda Colombia y pago seguro con Wompi, PSE y tarjetas."
        canonicalUrl="https://netpowerit.co"
      />


      {/* Hero Slider */}
      <section className="relative overflow-hidden min-h-[480px] flex items-center">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            aria-hidden={idx !== currentSlide}
          >
            <img
              src={slide.image}
              alt=""
              width={1920}
              height={800}
              fetchPriority={idx === 0 ? "high" : "low"}
              loading={idx === 0 ? "eager" : "lazy"}
              decoding={idx === 0 ? "sync" : "async"}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-dark/95 via-surface-dark/70 to-transparent" />
          </div>
        ))}

        <div className="container mx-auto px-6 py-20 md:py-24 relative z-10">
          <motion.div
            key={currentSlide}
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="max-w-xl"
          >
            {slides[currentSlide].badge && (
              <motion.span
                variants={fadeUp}
                className="inline-block bg-secondary text-secondary-foreground font-black text-2xl md:text-3xl px-5 py-1.5 rounded-full mb-5 animate-pulse"
              >
                {slides[currentSlide].badge}
              </motion.span>
            )}
            {!slides[currentSlide].badge && (
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 backdrop-blur-sm border border-primary/25 text-primary text-xs font-semibold mb-5">
                <CheckCircle className="w-3 h-3" /> Distribuidores autorizados
              </motion.div>
            )}
            <motion.h1 variants={fadeUp} className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-card leading-tight mb-4">
              {slides[currentSlide].highlight ? (
                <>
                  Tu proveedor <span className="text-primary">{slides[currentSlide].highlight}</span> de tecnología TIC
                </>
              ) : (
                slides[currentSlide].title
              )}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-base text-card/70 mb-7 max-w-md leading-relaxed">
              {slides[currentSlide].subtitle}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              <Link to={slides[currentSlide].ctaLink} className="inline-flex h-11 px-7 items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold shadow-button hover:opacity-90 transition-all text-sm">
                {slides[currentSlide].cta} <ArrowRight className="w-4 h-4" />
              </Link>
              <button onClick={() => openChat("quote")} className="inline-flex h-11 px-7 items-center gap-2 rounded-lg border border-card/25 text-card font-semibold hover:bg-card/10 backdrop-blur-sm transition text-sm">
                Solicitar Cotización
              </button>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-5">
              <TrustBadges />
            </motion.div>
          </motion.div>
        </div>

        {/* Indicadores */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              aria-label={`Ir al slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? "bg-card w-8" : "bg-card/40 w-2"}`}
            />
          ))}
        </div>

        {/* Flechas */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
          aria-label="Slide anterior"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-card/20 hover:bg-card/30 text-card w-10 h-10 rounded-full flex items-center justify-center transition-colors text-2xl"
        >
          ‹
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          aria-label="Slide siguiente"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-card/20 hover:bg-card/30 text-card w-10 h-10 rounded-full flex items-center justify-center transition-colors text-2xl"
        >
          ›
        </button>
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
                <Link to={`/categoria/${cat.slug}`} className="group flex items-center gap-3 p-4 rounded-xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-card-hover transition-all">
                  <span className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-primary shrink-0">
                    {cat.lucideIcon}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-card-foreground group-hover:text-primary transition truncate">{cat.name}</h3>
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
            {featuredProducts.slice(0, 8).map((p: any) =>
            <ProductCard key={p.id} product={p} />
            )}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-16 overflow-hidden">
        <img src={ctaBanner} alt="Cotización empresarial" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-surface-dark/85" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-card mb-3">¿Necesitas servicios profesionales para servidores?</h2>
          <p className="text-card/65 mb-7 max-w-md mx-auto text-sm">Instalación, configuración, mantenimiento y soporte especializado para tu infraestructura TI.</p>
          <a href="https://avaconit.com/" target="_blank" rel="noopener noreferrer" className="inline-flex h-11 px-7 items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold shadow-button hover:opacity-90 transition-all text-sm">
            Ver servicios profesionales <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Brands */}
      {homeBrands.length > 0 && (
        <section className="py-14 bg-background">
          <div className="container mx-auto px-6">
            <h2 className="text-center text-2xl md:text-3xl font-extrabold text-foreground mb-8">Marcas que Distribuimos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {homeBrands.map((brand) => (
                <Link
                  key={brand.id}
                  to={`/tienda?marca=${brand.slug}`}
                  className="flex items-center justify-center p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-card-hover transition-all h-20"
                >
                  {brand.logo_url ? (
                    <img
                      src={brand.logo_url}
                      alt={brand.name}
                      loading="lazy"
                      className="max-h-10 max-w-[120px] object-contain filter grayscale hover:grayscale-0 transition-all"
                    />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">{brand.name}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-14 bg-card">
        <div className="container mx-auto px-6">
          <h2 className="text-center text-2xl md:text-3xl font-extrabold text-foreground mb-8">Lo que Dicen Nuestros Clientes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
            { name: "Jorge M.", role: "Director de Tecnología", text: "Excelente servicio y rapidez en la entrega. Los UPS que compramos funcionan perfecto." },
            { name: "Ana P.", role: "Coordinadora de Sistemas", text: "El equipo nos asesoró con la solución de energía ideal para nuestro centro de datos." },
            { name: "Andrés L.", role: "Gerente de Infraestructura TI", text: "Precios competitivos y garantía oficial. Llevamos años comprando con ellos sin problemas." }].
            map((t, i) =>
            <div key={i} className="p-5 rounded-xl bg-background border border-border/60">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-secondary fill-secondary" />)}
                </div>
                <p className="text-sm text-muted-foreground mb-4 italic leading-relaxed">"{t.text}"</p>
                <p className="font-semibold text-sm text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            )}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6 italic">Testimonio representativo de cliente de Netpower IT</p>
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
              href="https://wa.me/573504609431?text=Hola,%20necesito%20cotizar%20un%20proyecto%20empresarial"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 px-7 items-center gap-2 rounded-lg border border-surface-dark-foreground/25 text-surface-dark-foreground font-semibold hover:bg-surface-dark-foreground/10 transition text-sm">
              
              Chatear por WhatsApp
            </a>
          </div>
          <div className="mt-5 flex justify-center">
            <TrustBadges />
          </div>
        </div>
      </section>
    </>);

}
