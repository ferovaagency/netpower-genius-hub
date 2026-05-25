import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ShieldCheck, Users, Headphones, Globe, Award, Truck } from "lucide-react";
import anaMariaPhoto from "@/assets/team/ana-maria-osorio.png";
import gonzaloPhoto from "@/assets/team/gonzalo.jpeg";

const team = [
  {
    photo: anaMariaPhoto,
    name: "Ana María Osorio",
    role: "CEO",
    bio: "Lidera la estrategia comercial y operativa de Netpower IT, con foco en construir relaciones de largo plazo con clientes empresariales en Colombia.",
  },
  {
    photo: gonzaloPhoto,
    name: "Gonzalo",
    role: "Director de Estrategia",
    bio: "Define la dirección de portafolio y alianzas con fabricantes, asegurando soluciones de infraestructura confiables para cada cliente.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>Quiénes Somos – Netpower IT Colombia</title>
        <meta name="description" content="Netpower IT es tu proveedor de confianza en tecnología TIC en Colombia. Distribuidores autorizados con garantía oficial y soporte técnico." />
        <link rel="canonical" href="https://netpowerit.co/nosotros" />
        <meta property="og:title" content="Quiénes Somos — Netpower IT" />
        <meta property="og:description" content="Equipo, experiencia y propuesta de valor de Netpower IT, proveedor TIC empresarial en Colombia." />
        <meta property="og:url" content="https://netpowerit.co/nosotros" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition">Inicio</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Quiénes Somos</span>
        </nav>

        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4">Quiénes Somos</h1>
          <p className="text-muted-foreground leading-relaxed">
            Netpower IT es una empresa colombiana especializada en tecnología TIC. Somos distribuidores autorizados de las mejores marcas del mercado,
            ofreciendo soluciones en UPS, baterías, infraestructura de red, energía solar, servidores, licencias, monitores y accesorios
            con garantía oficial y soporte técnico especializado.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {[
            { icon: ShieldCheck, title: "Distribuidores Autorizados", desc: "Trabajamos directamente con fabricantes para garantizar productos originales con garantía oficial." },
            { icon: Users, title: "Asesoría Personalizada", desc: "Nuestro equipo técnico te acompaña en la selección de la solución ideal para tu proyecto." },
            { icon: Headphones, title: "Soporte Técnico", desc: "Brindamos soporte post-venta con técnicos certificados en las principales marcas." },
            { icon: Globe, title: "Cobertura Nacional", desc: "Realizamos envíos a todo Colombia con transportadoras certificadas y tiempos de entrega competitivos." },
            { icon: Award, title: "Calidad Garantizada", desc: "Todos nuestros productos cuentan con garantía del fabricante y facturación electrónica." },
            { icon: Truck, title: "Logística Eficiente", desc: "Contamos con inventario disponible para despacho inmediato en las principales ciudades." },
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-xl bg-card border border-border shadow-card">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-bold text-foreground mb-2">{item.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Equipo directivo */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">Equipo directivo</h2>
            <p className="text-muted-foreground text-sm">Las personas detrás de Netpower IT</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {team.map((m) => (
              <div key={m.name} className="flex flex-col sm:flex-row gap-5 p-6 rounded-xl bg-card border border-border shadow-card">
                <div className="shrink-0 mx-auto sm:mx-0">
                  <img
                    src={m.photo}
                    alt={`Foto de ${m.name}, ${m.role} de Netpower IT`}
                    className="w-28 h-28 rounded-full object-cover border-4 border-accent"
                  />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-bold text-lg text-foreground">{m.name}</h3>
                  <p className="text-sm text-primary font-semibold mb-2">{m.role}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{m.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reseñas Google (Elfsight) */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">Lo que dicen nuestros clientes en Google</h2>
            <p className="text-muted-foreground text-sm">Reseñas verificadas de Google My Business</p>
          </div>
          {/* Pega aquí el script embed de Elfsight (ej: <div class="elfsight-app-XXXX"></div> + script src) */}
          <div className="elfsight-app-placeholder text-center text-sm text-muted-foreground py-8 border border-dashed border-border rounded-xl">
            Widget de reseñas pendiente — pega el script de Elfsight en <code>src/pages/AboutPage.tsx</code> dentro de esta sección.
          </div>
        </section>

        <div className="text-center bg-accent rounded-2xl p-10">
          <h2 className="text-xl font-extrabold text-foreground mb-3">¿Tienes un proyecto en mente?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Cuéntanos tu necesidad y te asesoramos con la mejor solución tecnológica.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/cotizacion" className="inline-flex h-11 px-6 items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition">
              Solicitar Cotización
            </Link>
            <Link to="/contacto" className="inline-flex h-11 px-6 items-center gap-2 rounded-lg border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition">
              Contactar
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
