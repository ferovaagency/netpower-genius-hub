import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Mail, Phone, MapPin, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export default function ContactPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const schema = z.object({
    name: z.string().trim().min(2, "Nombre requerido").max(100),
    email: z.string().trim().email("Email inválido").max(255),
    phone: z.string().trim().min(7, "Teléfono inválido").max(30),
    message: z.string().trim().min(5, "Mensaje requerido").max(1500),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Revisa el formulario", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("quote_requests").insert({
      source: "contact_form",
      customer_name: parsed.data.name,
      customer_email: parsed.data.email,
      customer_phone: parsed.data.phone,
      subject: "Mensaje desde formulario de contacto",
      message: parsed.data.message,
      status: "new",
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error al enviar", description: error.message, variant: "destructive" });
      return;
    }
    setSent(true);
    setForm({ name: "", email: "", phone: "", message: "" });
    toast({ title: "✅ Mensaje enviado", description: "Te contactaremos en menos de 1 hora hábil." });
  };

  return (
    <>
      <Helmet>
        <title>Contacto | Netpower IT — Tecnología TIC en Bogotá Colombia</title>
        <meta name="description" content="Contáctenos para cotizar computadores, servidores y equipos de red para su empresa en Colombia. Asesoría especializada TIC." />
        <link rel="canonical" href="https://netpowerit.co/contacto" />
        <meta property="og:title" content="Contacto — Netpower IT Colombia" />
        <meta property="og:description" content="Cotiza UPS, servidores, redes y cómputo empresarial con asesoría especializada en Colombia." />
        <meta property="og:url" content="https://netpowerit.co/contacto" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "@id": "https://netpowerit.co/contacto#page",
          "name": "Contacto — Netpower IT",
          "url": "https://netpowerit.co/contacto",
          "description": "Contáctenos para asesoría en tecnología TIC para empresas en Colombia",
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {"@type":"ListItem","position":1,"name":"Inicio","item":"https://netpowerit.co"},
              {"@type":"ListItem","position":2,"name":"Contacto","item":"https://netpowerit.co/contacto"}
            ]
          }
        })}</script>
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
              { icon: Phone, label: "Teléfono / WhatsApp", value: "+57 350 460 9431", href: "tel:+573504609431" },
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
              { id: "contact-name", label: "Nombre", type: "text", placeholder: "Tu nombre completo" },
              { id: "contact-email", label: "Email", type: "email", placeholder: "tu@email.com" },
              { id: "contact-phone", label: "Teléfono", type: "tel", placeholder: "+57 350 460 9431" },
            ].map(f => (
              <div key={f.id}>
                <label htmlFor={f.id} className="text-sm font-medium text-foreground mb-1 block">{f.label}</label>
                <input id={f.id} type={f.type} placeholder={f.placeholder} className="w-full h-10 px-4 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
              </div>
            ))}
            <div>
              <label htmlFor="contact-message" className="text-sm font-medium text-foreground mb-1 block">Mensaje</label>
              <textarea id="contact-message" placeholder="¿En qué podemos ayudarte?" rows={4} className="w-full px-4 py-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none" />
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
