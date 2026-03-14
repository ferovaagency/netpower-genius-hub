import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <>
      <Helmet>
        <title>Contacto – Netpower IT Colombia</title>
        <meta name="description" content="Contáctanos para asesoría en tecnología TIC. Teléfono, email y WhatsApp disponibles." />
        <link rel="canonical" href="https://netpowerit.co/contacto" />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition">Inicio</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Contacto</span>
        </nav>

        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-8">Contacto</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            {[
              { icon: Mail, label: "Email", value: "aosorio@netpowerit.co", href: "mailto:aosorio@netpowerit.co" },
              { icon: Phone, label: "Teléfono / WhatsApp", value: "+57 301 841 7895", href: "tel:+573018417895" },
              { icon: MapPin, label: "Ubicación", value: "Bogotá, Colombia · Servicio en toda Colombia e internacional", href: undefined },
              { icon: Clock, label: "Horario", value: "Lun-Vie 8am-6pm | Sáb 9am-1pm", href: undefined },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-5 bg-card rounded-xl border border-border shadow-card">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} className="font-semibold text-card-foreground hover:text-primary transition">{item.value}</a>
                  ) : (
                    <p className="font-semibold text-card-foreground">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form className="bg-card rounded-xl border border-border shadow-card p-6 space-y-4">
            <h2 className="font-bold text-foreground mb-2">Envíanos un mensaje</h2>
            {[
              { label: "Nombre", type: "text", placeholder: "Tu nombre completo" },
              { label: "Email", type: "email", placeholder: "tu@email.com" },
              { label: "Teléfono", type: "tel", placeholder: "+57 301 841 7895" },
            ].map(f => (
              <div key={f.label}>
                <label className="text-sm font-medium text-foreground mb-1 block">{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} className="w-full h-10 px-4 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
              </div>
            ))}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Mensaje</label>
              <textarea placeholder="¿En qué podemos ayudarte?" rows={4} className="w-full px-4 py-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none" />
            </div>
            <button type="button" className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold shadow-button hover:opacity-90 transition-all">
              Enviar Mensaje
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
