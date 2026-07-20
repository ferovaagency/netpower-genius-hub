import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Rocket,
  TrendingUp,
  Target,
  AlertTriangle,
  Compass,
  Sparkles,
  BookOpen,
  Wrench,
  ArrowRight,
  ExternalLink,
  Quote,
  Building2,
  Users,
  Globe,
} from "lucide-react";

const FEROVA_URL = "https://one.ferova.com.co";
const FEROVA_HOST = "one.ferova.com.co";

type Lang = "es" | "en";

const questionIcons = [TrendingUp, Target, AlertTriangle, Compass, Sparkles];
const ecosystemIcons = [BookOpen, Wrench];

const content: Record<
  Lang,
  {
    metaTitle: string;
    metaDescription: string;
    breadcrumbHome: string;
    badge: string;
    h1: string;
    subheading: string;
    ctaExplore: string;
    ctaDemo: string;
    stats: { value: string; label: string }[];
    quote: string;
    quoteName: string;
    quoteRole: string;
    flagshipBadge: string;
    flagshipTitle: string;
    flagshipDescription: string;
    modules: string[];
    questionsHeading: string;
    questions: string[];
    flagshipCta: string;
    ecosystemHeading: string;
    ecosystemSubheading: string;
    ecosystem: { name: string; description: string }[];
    missionHeading: string;
    missionParagraph: string;
    visitCta: string;
    contactCta: string;
  }
> = {
  en: {
    metaTitle: "Ferova — AI Innovation Division of Netpower IT",
    metaDescription:
      "Ferova is Netpower IT's AI innovation division. Meet Ferova One, an AI Business Operating System built for small businesses, and explore the Ferova ecosystem.",
    breadcrumbHome: "Home",
    badge: "Netpower IT's AI Innovation Division",
    h1: "We're democratizing the advantages of big companies.",
    subheading:
      "Every small business deserves access to the same technology, insights, and business capabilities that large companies rely on every day.",
    ctaExplore: "Explore Ferova One",
    ctaDemo: "Watch a demo",
    stats: [
      { value: "99.9%", label: "of all businesses in the United States are small businesses" },
      { value: "", label: "They create jobs, fuel innovation, and drive the economy" },
      { value: "", label: "Yet most lack access to the technology large companies rely on" },
    ],
    quote:
      "We believe every entrepreneur deserves those same advantages. Ferova is more than a single product — we are building an ecosystem of AI solutions for small businesses and communities.",
    quoteName: "María Fernanda Calderón",
    quoteRole: "Founder, Ferova",
    flagshipBadge: "Flagship Product",
    flagshipTitle: "Ferova One",
    flagshipDescription:
      "An AI Business Operating System built specifically for small businesses. Instead of forcing business owners to learn multiple software platforms, Ferova One brings everything together in one intelligent workspace.",
    modules: ["Planning", "Customers", "Sales", "Finance", "Projects", "Business Intelligence", "AI"],
    questionsHeading: "Five essential questions, answered every day",
    questions: [
      "How is my business doing?",
      "What should I focus on today?",
      "What needs my attention?",
      "What risks am I missing?",
      "What's my next best move?",
    ],
    flagshipCta: `See Ferova One at ${FEROVA_HOST}`,
    ecosystemHeading: "A growing ecosystem of AI solutions",
    ecosystemSubheading: "Ferova is more than a single product — for small businesses and communities alike.",
    ecosystem: [
      {
        name: "Ferova Library",
        description:
          "Helps readers organize their personal library, track reading goals, and discover their next book through an empathetic AI that understands their mood, interests, and personal context.",
      },
      {
        name: "Ferova Small Business Tools",
        description:
          "A growing collection of pay-per-use AI tools that help entrepreneurs complete occasional business tasks — reviewing contracts, comparing business proposals, screening resumes, and much more — without paying for expensive enterprise software.",
      },
    ],
    missionHeading: "Our mission: democratize the advantages of big companies.",
    missionParagraph:
      "We'd love the opportunity to show you how Ferova can help millions of entrepreneurs work smarter, grow faster, and compete with confidence.",
    visitCta: `Visit ${FEROVA_HOST}`,
    contactCta: "Contact Us",
  },
  es: {
    metaTitle: "Ferova — División de Innovación en IA de Netpower IT",
    metaDescription:
      "Ferova es la división de innovación en IA de Netpower IT. Conoce Ferova One, un sistema operativo de negocio con IA hecho para pequeñas empresas, y todo el ecosistema Ferova.",
    breadcrumbHome: "Inicio",
    badge: "División de Innovación en IA de Netpower IT",
    h1: "Estamos democratizando las ventajas de las grandes empresas.",
    subheading:
      "Toda pequeña empresa merece acceso a la misma tecnología, información y capacidades de negocio que las grandes empresas usan todos los días.",
    ctaExplore: "Explora Ferova One",
    ctaDemo: "Ver una demo",
    stats: [
      { value: "99.9%", label: "de todas las empresas en Estados Unidos son pequeñas empresas" },
      { value: "", label: "Crean empleo, impulsan la innovación y mueven la economía" },
      { value: "", label: "Sin embargo, la mayoría no tiene acceso a la tecnología que usan las grandes empresas" },
    ],
    quote:
      "Creemos que todo emprendedor merece esas mismas ventajas. Ferova es más que un solo producto: estamos construyendo un ecosistema de soluciones de IA para pequeñas empresas y comunidades.",
    quoteName: "María Fernanda Calderón",
    quoteRole: "Fundadora de Ferova",
    flagshipBadge: "Producto Insignia",
    flagshipTitle: "Ferova One",
    flagshipDescription:
      "Un sistema operativo de negocio con IA hecho específicamente para pequeñas empresas. En vez de obligar al empresario a aprender varias plataformas de software, Ferova One reúne todo en un solo espacio de trabajo inteligente.",
    modules: ["Planeación", "Clientes", "Ventas", "Finanzas", "Proyectos", "Inteligencia de Negocio", "IA"],
    questionsHeading: "Cinco preguntas esenciales, respondidas cada día",
    questions: [
      "¿Cómo va mi negocio?",
      "¿En qué debo enfocarme hoy?",
      "¿Qué necesita mi atención?",
      "¿Qué riesgos se me están pasando?",
      "¿Cuál es mi mejor siguiente paso?",
    ],
    flagshipCta: `Conoce Ferova One en ${FEROVA_HOST}`,
    ecosystemHeading: "Un ecosistema creciente de soluciones de IA",
    ecosystemSubheading: "Ferova es más que un solo producto: es para pequeñas empresas y comunidades por igual.",
    ecosystem: [
      {
        name: "Ferova Library",
        description:
          "Ayuda a los lectores a organizar su biblioteca personal, seguir sus metas de lectura y descubrir su próximo libro a través de una IA empática que entiende su estado de ánimo, sus intereses y su contexto personal.",
      },
      {
        name: "Ferova Small Business Tools",
        description:
          "Una colección creciente de herramientas de IA de pago por uso que ayudan al empresario a resolver tareas puntuales del negocio —revisar contratos, comparar propuestas comerciales, filtrar hojas de vida y mucho más— sin pagar por software empresarial costoso.",
      },
    ],
    missionHeading: "Nuestra misión: democratizar las ventajas de las grandes empresas.",
    missionParagraph:
      "Nos encantaría mostrarte cómo Ferova puede ayudar a millones de emprendedores a trabajar de forma más inteligente, crecer más rápido y competir con confianza.",
    visitCta: `Visita ${FEROVA_HOST}`,
    contactCta: "Contáctanos",
  },
};

export default function FerovaPage() {
  const [lang, setLang] = useState<Lang>("es");
  const t = content[lang];

  return (
    <>
      <Helmet htmlAttributes={{ lang }}>
        <title>{t.metaTitle}</title>
        <meta name="description" content={t.metaDescription} />
        <link rel="canonical" href="https://netpowerit.co/ferova" />
        <meta property="og:title" content={t.metaTitle} />
        <meta property="og:description" content={t.metaDescription} />
        <meta property="og:url" content="https://netpowerit.co/ferova" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between gap-4 mb-6">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary transition">{t.breadcrumbHome}</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Ferova</span>
          </nav>

          <div
            role="group"
            aria-label="Language / Idioma"
            className="inline-flex items-center rounded-full border border-border bg-card p-1"
          >
            <button
              onClick={() => setLang("es")}
              aria-pressed={lang === "es"}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                lang === "es" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary"
              }`}
            >
              ES
            </button>
            <button
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary"
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-primary text-xs font-semibold mb-6">
            <Building2 className="w-3.5 h-3.5" />
            {t.badge}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-6 leading-tight">
            {t.h1}
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">{t.subheading}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={FEROVA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 px-7 items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
            >
              {t.ctaExplore} <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={FEROVA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 px-7 items-center gap-2 rounded-lg border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition"
            >
              {t.ctaDemo} <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Stat context */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {t.stats.map((stat, i) => {
            const StatIcon = i === 1 ? Users : i === 2 ? Globe : null;
            return (
              <div key={i} className="p-6 rounded-xl bg-card border border-border shadow-card text-center">
                {stat.value ? (
                  <p className="text-3xl font-extrabold text-primary mb-1">{stat.value}</p>
                ) : (
                  StatIcon && <StatIcon className="w-7 h-7 text-primary mx-auto mb-2" />
                )}
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Founder quote */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className="p-8 rounded-2xl bg-accent relative">
            <Quote className="w-8 h-8 text-primary/40 mb-4" />
            <p className="text-foreground text-lg leading-relaxed mb-6">"{t.quote}"</p>
            <div>
              <p className="font-bold text-foreground">{t.quoteName}</p>
              <p className="text-sm text-primary font-semibold">{t.quoteRole}</p>
            </div>
          </div>
        </div>

        {/* Flagship product */}
        <section className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-primary text-xs font-semibold mb-4">
              <Rocket className="w-3.5 h-3.5" />
              {t.flagshipBadge}
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">{t.flagshipTitle}</h2>
            <p className="text-muted-foreground leading-relaxed">{t.flagshipDescription}</p>
          </div>

          <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-2 mb-10">
            {t.modules.map((m) => (
              <span
                key={m}
                className="text-sm font-medium px-4 py-1.5 rounded-full bg-card border border-border text-foreground"
              >
                {m}
              </span>
            ))}
          </div>

          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
            {t.questionsHeading}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto mb-10">
            {t.questions.map((question, i) => {
              const QIcon = questionIcons[i];
              return (
                <div key={i} className="p-5 rounded-xl bg-card border border-border shadow-card text-center">
                  <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center mx-auto mb-3">
                    <QIcon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground leading-snug">{question}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <a
              href={FEROVA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 px-6 items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
            >
              {t.flagshipCta} <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* Ecosystem */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">{t.ecosystemHeading}</h2>
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto">{t.ecosystemSubheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {t.ecosystem.map((item, i) => {
              const EIcon = ecosystemIcons[i];
              return (
                <div key={item.name} className="p-6 rounded-xl bg-card border border-border shadow-card">
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-4">
                    <EIcon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{item.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Mission + CTA */}
        <div className="text-center bg-accent rounded-2xl p-10">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground mb-3">{t.missionHeading}</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto leading-relaxed">{t.missionParagraph}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={FEROVA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 px-6 items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
            >
              {t.visitCta} <ExternalLink className="w-4 h-4" />
            </a>
            <Link
              to="/contacto"
              className="inline-flex h-11 px-6 items-center gap-2 rounded-lg border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition"
            >
              {t.contactCta}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
