import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ShieldCheck, Users, Headphones, Globe, Award, Truck } from "lucide-react";

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>Quiénes Somos – Netpower IT Colombia</title>
        <meta name="description" content="Netpower IT es tu proveedor de confianza en tecnología TIC en Colombia. Distribuidores autorizados con garantía oficial y soporte técnico." />
        <link rel="canonical" href="https://netpowerit.co/nosotros" />
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
              <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

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
