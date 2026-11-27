import { Helmet } from "react-helmet-async";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import quoteBanner from "@/assets/quote-banner.jpg";

const types = [
  { icon: "🔋", title: "Protección Eléctrica", desc: "UPS, reguladores y baterías de respaldo", slug: "ups" },
  { icon: "🌐", title: "Infraestructura de Red", desc: "Switches, routers, WiFi y cableado", slug: "infraestructura" },
  { icon: "☀️", title: "Energía Solar", desc: "Paneles, inversores y sistemas fotovoltaicos", slug: "solar" },
  { icon: "🖥️", title: "Servidores y Equipos", desc: "Servidores, almacenamiento y computo", slug: "servidores" },
  { icon: "📄", title: "Licenciamiento", desc: "Microsoft, Fortinet, Kaspersky y más", slug: "licencias" },
  { icon: "📦", title: "Proyecto Personalizado", desc: "Cuéntanos tu necesidad y te asesoramos", slug: "personalizado" },
];

export default function QuotePage() {
  // Las tarjetas abren a Neti en modo cotizacion, igual que el boton
  // "Cotizar" del menu. Antes sacaban al visitante a WhatsApp: la cotizacion
  // se perdia fuera del sitio y no quedaba registrada en `quote_requests`.
  const { openChat } = useChat();

  return (
    <>
      <Helmet>
        <title>Cotizaciones – Proyectos TIC a la Medida | Netpower IT</title>
        <meta name="description" content="Cotiza tu proyecto de tecnología TIC con asesoría experta. UPS, infraestructura de red, energía solar, servidores y licencias." />
        <link rel="canonical" href="https://netpowerit.co/cotizacion" />
      </Helmet>

      <section className="relative py-16 overflow-hidden">
        <img src={quoteBanner} alt="Cotizaciones TIC" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[hsl(0,0%,13%)/0.85]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[hsl(0,0%,100%)] mb-3">Cotiza tu Proyecto TIC</h1>
          <p className="text-[hsl(0,0%,100%)/0.7] max-w-lg mx-auto">Asesoría experta para dimensionar la solución ideal según tus necesidades</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {types.map(t => (
            <div key={t.slug} className="group bg-card rounded-xl border border-border shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all p-6 flex flex-col">
              <span className="text-4xl mb-4">{t.icon}</span>
              <h2 className="text-lg font-bold text-foreground mb-1">{t.title}</h2>
              <p className="text-sm text-muted-foreground mb-6 flex-1">{t.desc}</p>
              <button
                type="button"
                onClick={() => openChat("quote")}
                className="self-start inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:text-secondary transition"
              >
                Iniciar cotización <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">¿Cómo funciona?</h2>
          <ol className="text-sm text-muted-foreground max-w-md mx-auto text-left space-y-1 list-decimal list-inside mb-6">
            <li>Cuéntale a Neti qué necesitas: equipo, cantidad y para qué lo vas a usar.</li>
            <li>Te pide los datos de facturación, incluido el NIT o la cédula. Sin ese dato no podemos emitir una cotización formal.</li>
            <li>La solicitud queda registrada y un asesor la revisa y te responde.</li>
          </ol>
          <button
            type="button"
            onClick={() => openChat("quote")}
            className="inline-flex h-11 px-7 items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-button hover:opacity-90 transition-all"
          >
            <MessageCircle className="w-4 h-4" /> Cotizar con Neti
          </button>

          <p className="text-muted-foreground text-sm mt-8">¿Prefieres hablar con un asesor por WhatsApp?</p>
          <a
            href="https://wa.me/573504609431?text=Hola,%20necesito%20cotizar%20un%20proyecto%20TIC"
            data-wa-origen="cotizador_principal"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex mt-3 h-10 px-6 items-center gap-2 rounded-lg border border-border text-foreground text-sm font-semibold hover:bg-accent transition-all"
          >
            Escribir por WhatsApp
          </a>
        </div>
      </div>
    </>
  );
}
