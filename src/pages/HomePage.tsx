import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, ShieldCheck, Truck, Headphones, FileText, Star, CheckCircle, Zap, PlugZap, TrendingUp } from "lucide-react";
import { categories, products } from "@/data/store-data";
import { supabase } from "@/integrations/supabase/client";
import { useChat } from "@/contexts/ChatContext";
import ProductCard from "@/components/store/ProductCard";
import { getParentCategory } from "@/lib/catalog";
import SeoHead from "@/components/SeoHead";
import TrustBadges from "@/components/TrustBadges";
import ctaBanner from "@/assets/cta-banner.jpg";
import bannerTienda from "@/assets/banner-tienda.jpg";
import bannerForzaAtlas from "@/assets/banner-forza-atlas.jpg";

// Logos de marca comprimidos (public/brand-logos, webp de 96 px de alto).
// Si una marca no tiene copia local se usa el logo original de la base.
const LOGOS_LOCALES = new Set(["3nstar","adata","aoc","apc","asus","attech","benq","brother","caixun","canon","cdp","dahua","dell","epson","forza","genius","hikvision","hp","hpe","huawei","kaspersky","kingston","lenovo","linksys","logitech","mercusys","microsoft","powest","samsung","sandisk","sat","targus","tp-link","viewsonic","wattana","western-digital","xkim"]);

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

type SlideCTA =
  | { type: "link"; label: string; to: string }
  | { type: "external"; label: string; href: string }
  | { type: "chat"; label: string; mode: "general" | "quote" };

type Slide = {
  image: string;
  badge: string | null;
  titleParts: [string, string, string]; // before, highlight (text-primary), after
  subtitle: string;
  cta: SlideCTA;
  secondaryCta?: SlideCTA;
  layout?: "default" | "forza" | "office";
};

// Slide Forza: pastillas con iconos, texto despejado para no tapar el logo del banner.
const forzaChips = [
  { icon: Zap, label: "3 kVA = 3 kW de potencia real" },
  { icon: PlugZap, label: "Entrada de 110 a 300 V" },
  { icon: TrendingUp, label: "Escalable hasta 30 kVA" },
];

const slides: Slide[] = [
  {
    image: bannerForzaAtlas,
    layout: "forza",
    badge: null,
    titleParts: ["UPS Online ", "Forza Serie Atlas", ""],
    subtitle: "Potencia real PF 1 en toda la serie, entrada de 110 a 300 V y escalabilidad hasta 30 kVA.",
    cta: {
      type: "external",
      label: "Consulta con un especialista",
      href: "https://wa.me/573504609431?text=Hola,%20me%20interesa%20la%20UPS%20Online%20Forza%20Serie%20Atlas",
    },
  },
  // Catálogo y cotización en un solo banner.
  {
    image: bannerTienda,
    badge: null,
    titleParts: ["Compra en línea o ", "cotiza tu proyecto", " TIC"],
    subtitle: "UPS, baterías, servidores, redes y energía solar con garantía oficial y envío a todo Colombia. Si es un proyecto, te armamos la propuesta.",
    cta: { type: "link", label: "Ver Tienda", to: "/tienda" },
    secondaryCta: { type: "chat", label: "Cotizar proyecto", mode: "quote" },
  },
];

export default function HomePage() {
  const { openChat } = useChat();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [homeBrands, setHomeBrands] = useState<{ id: string; slug: string; name: string; logo_url: string | null }[]>([]);
  const [homePosts, setHomePosts] = useState<{ slug: string; h1: string; resumen_intro: string | null; industria: string | null }[]>([]);
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
    (supabase.from("blogs" as any) as any)
      .select("slug, h1, resumen_intro, industria")
      .eq("publicado", true)
      .order("fecha_publicacion", { ascending: false })
      .limit(3)
      .then(({ data }: any) => setHomePosts(data || []));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Destacados primero y livianos: solo 8 fichas con las columnas que usa
    // la tarjeta. Antes se descargaba el catálogo completo con todas sus
    // descripciones antes de pintar un solo producto.
    const loadFeatured = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, slug, name, short_description, price, sale_price, sku, stock, images, category, brand, featured")
        .eq("active", true)
        .order("featured", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(40);

      if (error || !data || cancelled) return;

      // En el home van primero las fichas que se pueden comprar ya (precio y
      // foto); "featured" desempata. Las de "Consultar precio" quedan al final.
      const puntaje = (r: any) =>
        (Number(r.sale_price ?? r.price ?? 0) > 0 ? 4 : 0) +
        (r.images?.[0] ? 2 : 0) +
        (r.featured ? 1 : 0);
      const elegidos = [...data].sort((a: any, b: any) => puntaje(b) - puntaje(a)).slice(0, 8);

      setFeaturedProducts(elegidos.map((r: any) => ({
        id: r.id, slug: r.slug, name: r.name, description: "",
        shortDesc: r.short_description ?? "", price: Number(r.price),
        salePrice: r.sale_price ? Number(r.sale_price) : null,
        sku: r.sku ?? "", stock: r.stock ?? 0, images: r.images ?? [],
        categoryId: r.category ?? "", brandId: r.brand ?? "",
        specs: {}, metaTitle: "", metaDesc: "",
        active: true, featured: r.featured ?? false,
      })));
    };

    // Conteo por categoría: solo la columna `category`.
    const loadCounts = async () => {
      const { data, error } = await supabase.from("products").select("category").eq("active", true);
      if (error || !data || cancelled) return;

      const nextCounts = Object.fromEntries(categories.map((category) => [category.name, 0])) as Record<string, number>;
      const categoryById = Object.fromEntries(categories.map((c) => [c.id, c.name]));
      const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c.name]));

      data.forEach((product: any) => {
        const raw = product.category ?? "";
        const mapped = categoryById[raw] ?? categoryBySlug[raw] ?? null;
        const normalizedCategory = mapped ?? getParentCategory(raw);
        nextCounts[normalizedCategory] = (nextCounts[normalizedCategory] ?? 0) + 1;
      });

      setCategoryCounts(nextCounts);
    };

    void loadFeatured();
    void loadCounts();

    return () => {
      cancelled = true;
    };
  }, []);

  const categoriesWithCounts = categories.map((category) => ({
    ...category,
    productCount: categoryCounts[category.name] ?? 0,
  }));

  const currentSlideData = slides[currentSlide];
  const isForzaSlide = currentSlideData.layout === "forza";


  return (
    <>
      <SeoHead
        title="Netpower IT – UPS, Servidores y Soluciones TIC en Colombia"
        description="Compra UPS, baterías, servidores HPE, infraestructura de red y energía solar con garantía oficial. Envío a toda Colombia y pago seguro con Wompi, PSE y tarjetas."
        canonicalUrl="https://netpowerit.co"
      />


      {/* Hero Slider */}
      <section className="relative overflow-hidden min-h-[380px] md:min-h-[440px] flex items-center bg-surface-dark">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 overflow-hidden transition-opacity duration-1000 ${idx === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            aria-hidden={idx !== currentSlide}
          >
            <img
              src={slide.image}
              alt=""
              width={1920}
              height={800}
              {...({ fetchpriority: idx === 0 ? "high" : "low" } as any)}
              loading={idx === 0 ? "eager" : "lazy"}
              decoding={idx === 0 ? "sync" : "async"}
              className={`absolute inset-0 w-full h-full object-cover ${slide.layout === "office" ? "object-[78%_center] md:object-center" : slide.layout === "forza" ? "object-[30%_center] md:object-center" : "object-center"}`}
            />
            <div className={`absolute inset-0 ${slide.layout === "office" ? "bg-gradient-to-r from-surface-dark/80 via-surface-dark/20 to-transparent" : slide.layout === "forza" ? "bg-gradient-to-t from-surface-dark/95 via-surface-dark/25 to-transparent" : "bg-gradient-to-r from-surface-dark/95 via-surface-dark/70 to-transparent"}`} />
          </div>
        ))}


        <div className={`container mx-auto px-6 relative z-10 self-stretch flex ${isForzaSlide ? "items-end pt-16 pb-8 md:pb-10" : "items-center py-20 md:py-24"}`}>
          <div>
            <motion.div
              key={currentSlide}
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              className={isForzaSlide ? "max-w-lg" : "max-w-xl"}
            >
              {currentSlideData.badge && (
                <motion.span
                  variants={fadeUp}
                  className="inline-block bg-secondary text-secondary-foreground font-black text-2xl md:text-3xl px-5 py-1.5 rounded-full mb-5 animate-pulse shadow-lg"
                >
                  {currentSlideData.badge}
                </motion.span>
              )}
              {!currentSlideData.badge && !isForzaSlide && (
                <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 backdrop-blur-sm border border-primary/25 text-primary text-xs font-semibold mb-5">
                  <CheckCircle className="w-3 h-3" /> Distribuidores autorizados
                </motion.div>
              )}
              <motion.h1 variants={fadeUp} className={`font-extrabold text-card leading-tight mb-4 ${isForzaSlide ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl lg:text-5xl"}`}>
                {currentSlideData.titleParts[0]}
                <span className="text-primary">{currentSlideData.titleParts[1]}</span>
                {currentSlideData.titleParts[2]}
              </motion.h1>
              {isForzaSlide ? (
                <motion.div variants={fadeUp} className="flex flex-wrap gap-2.5 mb-7">
                  {forzaChips.map((chip) => (
                    <span key={chip.label} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-card/10 backdrop-blur-sm border border-card/20 text-card text-xs md:text-sm font-semibold">
                      <chip.icon className="w-4 h-4 text-primary shrink-0" /> {chip.label}
                    </span>
                  ))}
                </motion.div>
              ) : (
                <motion.p variants={fadeUp} className="text-base text-card/80 mb-7 max-w-md leading-relaxed">
                  {currentSlideData.subtitle}
                </motion.p>
              )}
              <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
                {currentSlideData.cta.type === "link" ? (
                  <Link to={(currentSlideData.cta as { to: string }).to} className="inline-flex h-11 px-7 items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold shadow-button hover:opacity-90 transition-all text-sm">
                    {currentSlideData.cta.label} <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : currentSlideData.cta.type === "external" ? (
                  <a href={(currentSlideData.cta as { href: string }).href} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 px-7 items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold shadow-button hover:opacity-90 transition-all text-sm">
                    {currentSlideData.cta.label} <ArrowRight className="w-4 h-4" />
                  </a>
                ) : (
                  <button onClick={() => openChat((currentSlideData.cta as { mode: "general" | "quote" }).mode)} className="inline-flex h-11 px-7 items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold shadow-button hover:opacity-90 transition-all text-sm">
                    {currentSlideData.cta.label} <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {currentSlideData.secondaryCta?.type === "chat" && (
                  <button
                    onClick={() => openChat((currentSlideData.secondaryCta as { mode: "general" | "quote" }).mode)}
                    className="inline-flex h-11 px-7 items-center gap-2 rounded-lg border border-card/40 bg-card/10 text-card font-semibold backdrop-blur-sm hover:bg-card/20 transition-all text-sm"
                  >
                    {currentSlideData.secondaryCta.label}
                  </button>
                )}
              </motion.div>
              {!isForzaSlide && (
                <motion.div variants={fadeUp} className="mt-5">
                  <TrustBadges />
                </motion.div>
              )}
            </motion.div>

          </div>
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
          className={`absolute z-20 bg-card/20 hover:bg-card/30 text-card w-10 h-10 rounded-full flex items-center justify-center transition-colors text-2xl ${isForzaSlide ? "top-4 right-16" : "left-4 top-1/2 -translate-y-1/2"}`}
        >
          ‹
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          aria-label="Slide siguiente"
          className={`absolute z-20 bg-card/20 hover:bg-card/30 text-card w-10 h-10 rounded-full flex items-center justify-center transition-colors text-2xl ${isForzaSlide ? "top-4 right-4" : "right-4 top-1/2 -translate-y-1/2"}`}
        >
          ›
        </button>
      </section>

      {/* Featured Products */}
      <section className="py-10 md:py-14 bg-card">
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
            {categoriesWithCounts.filter((c) => c.productCount > 0).map((cat, i) =>
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
                      src={LOGOS_LOCALES.has(brand.slug) ? `/brand-logos/${brand.slug}.webp` : brand.logo_url}
                      width={120}
                      height={40}
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

      {/* Blog */}
      {homePosts.length > 0 && (
        <section className="py-14 bg-card">
          <div className="container mx-auto px-6">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                  <BookOpen className="h-4 w-4" /> Blog
                </p>
                <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">Guías para elegir tu equipo</h2>
                <p className="mt-2 text-sm text-muted-foreground">Comparativas y consejos sobre UPS, servidores y energía para empresas.</p>
              </div>
              <Link to="/blog" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-primary hover:underline">
                Ver todos los artículos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {homePosts.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="group flex flex-col rounded-xl border border-border bg-background p-5 transition-all hover:border-primary hover:shadow-card-hover"
                >
                  {post.industria && (
                    <span className="mb-3 w-fit rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                      {post.industria}
                    </span>
                  )}
                  <h3 className="mb-2 line-clamp-3 text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">{post.h1}</h3>
                  {post.resumen_intro && <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">{post.resumen_intro}</p>}
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Leer guía <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-14 bg-background">
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
              data-wa-origen="home_cta"
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
