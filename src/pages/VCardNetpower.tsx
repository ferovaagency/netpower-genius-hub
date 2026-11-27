import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
} from "lucide-react";
import logoImg from "@/assets/logo-netpower-it.png";
import anaMariaPhoto from "@/assets/team/ana-maria-osorio.png";

const contact = {
  name: "Ana María Osorio",
  firstName: "Ana María",
  lastName: "Osorio",
  role: "CEO",
  company: "NetPower IT",
  phone: "+57 350 460 9431",
  phoneRaw: "+573504609431",
  whatsapp: "573504609431",
  email: "aosorio@netpowerit.co",
  web: "https://netpowerit.co",
  address: "AK 7 #156-80, NorthPoint Torre 2, Oficina 1004, Bogotá",
  maps: "https://maps.google.com/?q=AK+7+%23156-80+NorthPoint+Torre+2+Oficina+1004+Bogota",
};

const escapeVCard = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

export default function VCardNetpower() {
  const [visitorName, setVisitorName] = useState("");
  const [saved, setSaved] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">("idle");

  const downloadVCard = () => {
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${escapeVCard(contact.name)}`,
      `N:${escapeVCard(contact.lastName)};${escapeVCard(contact.firstName)};;;`,
      `ORG:${escapeVCard(contact.company)}`,
      `TITLE:${escapeVCard(contact.role)}`,
      `TEL;TYPE=CELL,VOICE:${contact.phoneRaw}`,
      `EMAIL;TYPE=WORK:${contact.email}`,
      `URL:${contact.web}`,
      `ADR;TYPE=WORK:;;${escapeVCard("AK 7 #156-80, NorthPoint Torre 2, Oficina 1004")};Bogotá;Bogotá D.C.;;Colombia`,
      `NOTE:${escapeVCard("CEO de NetPower IT — Tecnología e infraestructura TIC para empresas")}`,
      "END:VCARD",
    ].join("\r\n");

    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "AnaMariaOsorio-NetPowerIT.vcf";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setSaved(true);
  };

  const openWhatsApp = () => {
    const intro = visitorName.trim() ? `Hola Ana María, soy ${visitorName.trim()}.` : "Hola Ana María.";
    const message = encodeURIComponent(`${intro} Fue un gusto conocerte. Sigamos en contacto.`);
    window.open(`https://wa.me/${contact.whatsapp}?text=${message}`, "_blank", "noopener,noreferrer");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus("copied");
    } catch {
      setShareStatus("error");
    }
  };

  const shareContact = async () => {
    setShareStatus("idle");
    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({
        title: `${contact.name} — ${contact.company}`,
        text: `${contact.role} de ${contact.company}`,
        url: window.location.href,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copyLink();
    }
  };

  return (
    <>
      <Helmet>
        <title>Ana María Osorio | CEO de NetPower IT</title>
        <meta
          name="description"
          content="Contacto digital de Ana María Osorio, CEO de NetPower IT. Guarda sus datos o comunícate por WhatsApp, teléfono y correo."
        />
        <link rel="canonical" href="https://netpowerit.co/contacto-digital" />
        <meta property="og:title" content="Ana María Osorio | NetPower IT" />
        <meta property="og:description" content="CEO de NetPower IT — Tecnología e infraestructura TIC para empresas." />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content="https://netpowerit.co/contacto-digital" />
      </Helmet>

      <main className="relative min-h-dvh overflow-hidden bg-[#eef7f5] text-foreground">
        <div className="pointer-events-none absolute -left-28 top-16 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-12 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
          <header className="mb-5 flex items-center justify-between sm:mb-7">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver a NetPower IT
            </Link>
            <img src={logoImg} alt="NetPower IT" className="h-auto w-32 sm:w-40" />
          </header>

          <article className="my-auto grid overflow-hidden rounded-2xl bg-white shadow-[0_28px_80px_-42px_hsl(174_95%_24%/0.45)] lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-72 overflow-hidden bg-surface-dark sm:min-h-96 lg:min-h-[620px]">
              <img
                src={anaMariaPhoto}
                alt="Ana María Osorio, CEO de NetPower IT"
                className="absolute inset-0 h-full w-full object-cover object-center"
                width={1024}
                height={1024}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-surface-dark/85 via-surface-dark/20 to-transparent px-6 pb-6 pt-24 text-white lg:hidden">
                <h1 className="text-3xl font-extrabold tracking-[-0.03em]">{contact.name}</h1>
                <p className="mt-1 text-sm font-semibold text-primary-foreground/85">{contact.role} · {contact.company}</p>
              </div>
            </div>

            <div className="flex flex-col p-6 sm:p-8 lg:p-10">
              <div className="hidden lg:block">
                <h1 className="text-4xl font-extrabold tracking-[-0.03em] text-foreground">{contact.name}</h1>
                <p className="mt-2 text-base font-bold text-primary">{contact.role} · {contact.company}</p>
              </div>

              <p className="mt-0 max-w-xl text-sm leading-6 text-muted-foreground lg:mt-6">
                Lidero la estrategia comercial y operativa de NetPower IT, construyendo relaciones de largo plazo con empresas que buscan tecnología e infraestructura TIC confiable.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={downloadVCard}
                  className="col-span-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-button transition-transform hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:col-span-1"
                >
                  {saved ? <Check className="h-4 w-4" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
                  {saved ? "Contacto guardado" : "Guardar contacto"}
                </button>
                <button
                  type="button"
                  onClick={openWhatsApp}
                  className="col-span-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-surface-dark px-5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 hover:bg-surface-dark/90 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:col-span-1"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Escribir por WhatsApp
                </button>
              </div>

              <div className="mt-5">
                <label htmlFor="visitor-name" className="text-xs font-semibold text-muted-foreground">
                  Personaliza tu mensaje de WhatsApp <span className="font-normal">(opcional)</span>
                </label>
                <input
                  id="visitor-name"
                  type="text"
                  value={visitorName}
                  onChange={(event) => setVisitorName(event.target.value)}
                  placeholder="Tu nombre"
                  autoComplete="name"
                  className="mt-2 min-h-11 w-full rounded-xl bg-muted/70 px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:bg-white focus:ring-2 focus:ring-primary"
                />
              </div>

              <address className="mt-6 grid gap-1 not-italic">
                <a href={`tel:${contact.phoneRaw}`} className="group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span className="font-semibold">{contact.phone}</span>
                </a>
                <a href={`mailto:${contact.email}`} className="group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span className="font-semibold">{contact.email}</span>
                </a>
                <a href={contact.web} target="_blank" rel="noopener noreferrer" className="group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <Globe className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span className="font-semibold">netpowerit.co</span>
                  <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                </a>
                <a href={contact.maps} target="_blank" rel="noopener noreferrer" className="group flex min-h-11 items-start gap-3 rounded-xl px-3 py-3 text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="font-semibold leading-5">{contact.address}</span>
                  <ExternalLink className="ml-auto mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                </a>
              </address>

              <div className="mt-auto pt-6">
                <button
                  type="button"
                  onClick={shareContact}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {shareStatus === "copied" ? <Copy className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
                  {shareStatus === "copied" ? "Enlace copiado" : "Compartir contacto digital"}
                </button>
                <p aria-live="polite" className="mt-2 min-h-5 text-center text-xs text-muted-foreground">
                  {shareStatus === "error" ? "No pudimos copiar el enlace. Copia la URL desde el navegador." : saved ? "El archivo .vcf está listo para agregarlo a tus contactos." : ""}
                </p>
              </div>
            </div>
          </article>

          <footer className="mt-5 text-center text-xs text-muted-foreground sm:mt-7">
            © {new Date().getFullYear()} NetPower IT · Tecnología para empresas
          </footer>
        </div>
      </main>
    </>
  );
}
