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

const dailyQuestions = [
  { icon: TrendingUp, question: "How is my business doing?" },
  { icon: Target, question: "What should I focus on today?" },
  { icon: AlertTriangle, question: "What needs my attention?" },
  { icon: Compass, question: "What risks am I missing?" },
  { icon: Sparkles, question: "What's my next best move?" },
];

const workspaceModules = [
  "Planning",
  "Customers",
  "Sales",
  "Finance",
  "Projects",
  "Business Intelligence",
  "AI",
];

const ecosystem = [
  {
    icon: BookOpen,
    name: "Ferova Library",
    description:
      "Helps readers organize their personal library, track reading goals, and discover their next book through an empathetic AI that understands their mood, interests, and personal context.",
  },
  {
    icon: Wrench,
    name: "Ferova Small Business Tools",
    description:
      "A growing collection of pay-per-use AI tools that help entrepreneurs complete occasional business tasks — reviewing contracts, comparing business proposals, screening resumes, and much more — without paying for expensive enterprise software.",
  },
];

export default function FerovaPage() {
  return (
    <>
      <Helmet>
        <title>Ferova — AI Innovation Division of Netpower IT</title>
        <meta
          name="description"
          content="Ferova is Netpower IT's AI innovation division. Meet Ferova One, an AI Business Operating System built for small businesses, and explore the Ferova ecosystem."
        />
        <link rel="canonical" href="https://netpowerit.co/ferova" />
        <meta property="og:title" content="Ferova — AI Innovation Division of Netpower IT" />
        <meta
          property="og:description"
          content="An AI Business Operating System and a growing ecosystem of AI tools built for small businesses and communities."
        />
        <meta property="og:url" content="https://netpowerit.co/ferova" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition">Inicio</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Ferova</span>
        </nav>

        {/* Hero */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-primary text-xs font-semibold mb-6">
            <Building2 className="w-3.5 h-3.5" />
            Netpower IT's AI Innovation Division
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-6 leading-tight">
            We're democratizing the advantages of big companies.
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            Every small business deserves access to the same technology, insights, and business
            capabilities that large companies rely on every day.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={FEROVA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 px-7 items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
            >
              Explore Ferova One <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={FEROVA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 px-7 items-center gap-2 rounded-lg border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition"
            >
              Watch a demo <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Stat context */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-xl bg-card border border-border shadow-card text-center">
            <p className="text-3xl font-extrabold text-primary mb-1">99.9%</p>
            <p className="text-sm text-muted-foreground">
              of all businesses in the United States are small businesses
            </p>
          </div>
          <div className="p-6 rounded-xl bg-card border border-border shadow-card text-center">
            <Users className="w-7 h-7 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              They create jobs, fuel innovation, and drive the economy
            </p>
          </div>
          <div className="p-6 rounded-xl bg-card border border-border shadow-card text-center">
            <Globe className="w-7 h-7 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Yet most lack access to the technology large companies rely on
            </p>
          </div>
        </div>

        {/* Founder quote */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className="p-8 rounded-2xl bg-accent relative">
            <Quote className="w-8 h-8 text-primary/40 mb-4" />
            <p className="text-foreground text-lg leading-relaxed mb-6">
              "We believe every entrepreneur deserves those same advantages. Ferova is more than a
              single product — we are building an ecosystem of AI solutions for small businesses
              and communities."
            </p>
            <div>
              <p className="font-bold text-foreground">María Fernanda Calderón</p>
              <p className="text-sm text-primary font-semibold">Founder, Ferova</p>
            </div>
          </div>
        </div>

        {/* Flagship product */}
        <section className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-primary text-xs font-semibold mb-4">
              <Rocket className="w-3.5 h-3.5" />
              Flagship Product
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">Ferova One</h2>
            <p className="text-muted-foreground leading-relaxed">
              An AI Business Operating System built specifically for small businesses. Instead of
              forcing business owners to learn multiple software platforms, Ferova One brings
              everything together in one intelligent workspace.
            </p>
          </div>

          <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-2 mb-10">
            {workspaceModules.map((m) => (
              <span
                key={m}
                className="text-sm font-medium px-4 py-1.5 rounded-full bg-card border border-border text-foreground"
              >
                {m}
              </span>
            ))}
          </div>

          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
            Five essential questions, answered every day
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto mb-10">
            {dailyQuestions.map((item, i) => (
              <div key={i} className="p-5 rounded-xl bg-card border border-border shadow-card text-center">
                <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground leading-snug">{item.question}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <a
              href={FEROVA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 px-6 items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
            >
              See Ferova One at {FEROVA_URL.replace("https://", "")} <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* Ecosystem */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">
              A growing ecosystem of AI solutions
            </h2>
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
              Ferova is more than a single product — for small businesses and communities alike.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {ecosystem.map((item) => (
              <div key={item.name} className="p-6 rounded-xl bg-card border border-border shadow-card">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{item.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Mission + CTA */}
        <div className="text-center bg-accent rounded-2xl p-10">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground mb-3">
            Our mission: democratize the advantages of big companies.
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto leading-relaxed">
            We'd love the opportunity to show you how Ferova can help millions of entrepreneurs
            work smarter, grow faster, and compete with confidence.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={FEROVA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 px-6 items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
            >
              Visit {FEROVA_URL.replace("https://", "")} <ExternalLink className="w-4 h-4" />
            </a>
            <Link
              to="/contacto"
              className="inline-flex h-11 px-6 items-center gap-2 rounded-lg border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
