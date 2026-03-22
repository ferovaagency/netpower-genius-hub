import { useState } from 'react';
import { Download, Globe, Mail, Phone, Share2, Check } from 'lucide-react';

export default function VCardNetpower() {
  const [nombre, setNombre] = useState('');
  const [listo, setListo] = useState(false);
  const [error, setError] = useState(false);

  const info = {
    nombre: 'Ana Maria Osorio',
    cargo: 'CEO',
    empresa: 'Netpower IT',
    telefono: '+573018417896',
    email: 'aosorio@netpowerit.co',
    web: 'https://netpowerit.co',
    whatsapp: '573018417896',
  };

  const handleAccion = () => {
    if (!nombre.trim()) {
      setError(true);
      setTimeout(() => setError(false), 2000);
      return;
    }

    // 1 — Descargar .vcf
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${info.nombre}`,
      `N:Osorio;Ana Maria;;;`,
      `ORG:${info.empresa}`,
      `TITLE:${info.cargo}`,
      `TEL;TYPE=CELL:${info.telefono}`,
      `EMAIL:${info.email}`,
      `URL:${info.web}`,
      `NOTE:CEO de Netpower IT — Tecnología e infraestructura TIC para empresas`,
      'END:VCARD',
    ].join('\n');

    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AnaMariaOsorio-NetpowerIT.vcf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setListo(true);

    // 2 — Abrir WhatsApp con mensaje prellenado después de 1.2s
    setTimeout(() => {
      const mensaje = encodeURIComponent(
        `Hola Ana María, soy ${nombre.trim()} fue un gusto conocerte, sigamos en contacto`
      );
      window.open(`https://wa.me/${info.whatsapp}?text=${mensaje}`, '_blank');
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #0a0f1e 100%)' }}>

      <div className="w-full max-w-xs">

        {/* Card */}
        <div className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(160deg, #0f1c38, #0a1428)' }}>

          {/* Franja azul Netpower */}
          <div className="h-20 relative"
            style={{ background: 'linear-gradient(135deg, #0f3460, #1a5276, #2980b9)' }}>
            <div className="absolute inset-0"
              style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
          </div>

          {/* Logo */}
          <div className="flex justify-center -mt-12 mb-3 px-6">
            <div className="w-24 h-24 rounded-2xl border-4 overflow-hidden shadow-xl flex items-center justify-center"
              style={{ borderColor: '#2980b9', background: '#0f1c38' }}>
              <img
                src="/netpower-logo.png"
                alt="Netpower IT"
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = 'none';
                  el.parentElement!.innerHTML = '<span style="font-size:1.4rem;font-weight:900;color:#2980b9;text-align:center;line-height:1.2">NET<br/>POWER</span>';
                }}
              />
            </div>
          </div>

          <div className="px-6 pb-7">
            {/* Nombre y cargo */}
            <div className="text-center mb-5">
              <h1 className="text-lg font-bold text-white mb-0.5">{info.nombre}</h1>
              <p className="text-sm font-semibold" style={{ color: '#2980b9' }}>{info.cargo}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{info.empresa}</p>
            </div>

            {/* Datos de contacto */}
            <div className="space-y-1.5 mb-5">
              {[
                { icon: Phone, text: info.telefono, href: `tel:${info.telefono}` },
                { icon: Mail, text: info.email, href: `mailto:${info.email}` },
                { icon: Globe, text: 'netpowerit.co', href: info.web },
              ].map((item, i) => (
                <a key={i} href={item.href} target={i === 2 ? '_blank' : undefined} rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all hover:bg-white/5"
                  style={{ color: 'rgba(255,255,255,0.55)' }}>
                  <item.icon className="w-3.5 h-3.5 shrink-0" style={{ color: '#2980b9' }} />
                  {item.text}
                </a>
              ))}
            </div>

            {/* Separador */}
            <div className="mb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

            {/* Campo nombre */}
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.4)' }}>
                ¿Cómo te llamas?
              </label>
              <input
                type="text"
                value={nombre}
                onChange={e => { setNombre(e.target.value); setError(false); }}
                onKeyDown={e => e.key === 'Enter' && handleAccion()}
                placeholder="Tu nombre completo..."
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${error ? 'hsl(0,70%,55%)' : 'rgba(255,255,255,0.1)'}`,
                }}
              />
              {error && (
                <p className="text-xs mt-1.5" style={{ color: 'hsl(0,70%,65%)' }}>
                  Escribe tu nombre para continuar
                </p>
              )}
            </div>

            {/* Botón principal */}
            <button
              onClick={handleAccion}
              disabled={listo}
              className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 active:scale-95"
              style={{
                background: listo
                  ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                  : 'linear-gradient(135deg, #0f3460, #2980b9)',
                color: 'white',
                opacity: listo ? 0.9 : 1,
              }}
            >
              {listo ? (
                <><Check className="w-4 h-4" /> ¡Contacto guardado! Abriendo WhatsApp...</>
              ) : (
                <><Download className="w-4 h-4" /> Guardar contacto y escribirme</>
              )}
            </button>

            <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Descarga el contacto y te abre WhatsApp automáticamente
            </p>
          </div>
        </div>

        {/* Botón compartir */}
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Ana Maria Osorio — Netpower IT',
                text: 'CEO de Netpower IT',
                url: window.location.href,
              });
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('¡Link copiado al portapapeles!');
            }
          }}
          className="w-full mt-3 py-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all hover:bg-white/5"
          style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}
        >
          <Share2 className="w-3.5 h-3.5" /> Compartir mi contacto digital
        </button>

        <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.15)' }}>
          © {new Date().getFullYear()} Netpower IT
        </p>
      </div>
    </div>
  );
}
