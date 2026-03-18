import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
 
const tabs = ["Términos y Condiciones", "Tratamiento de Datos", "Política de Cookies"] as const;
type Tab = typeof tabs[number];
 
export default function LegalPage() {
  const [active, setActive] = useState<Tab>("Términos y Condiciones");
 
  return (
    <>
      <Helmet>
        <title>Información Legal | Netpower IT</title>
        <meta name="description" content="Términos y condiciones, política de tratamiento de datos y política de cookies de Netpower IT." />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Información Legal</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Netpower IT ·{" "}
          <a href="mailto:aosorio@netpowerit.co" className="underline hover:text-primary">
            aosorio@netpowerit.co
          </a>
        </p>
 
        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 mb-10 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex-1 min-w-fit ${
                active === t
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
 
        {/* Términos y Condiciones */}
        {active === "Términos y Condiciones" && (
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">1. Aceptación de los términos</h2>
              <p className="text-muted-foreground leading-relaxed">Al acceder y utilizar el sitio web de Netpower IT, el usuario acepta estos términos y condiciones. Si no está de acuerdo, debe abstenerse de usar el sitio. El titular del sitio es Netpower IT, contacto: <a href="mailto:aosorio@netpowerit.co" className="underline hover:text-primary">aosorio@netpowerit.co</a>.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">2. Proceso de compra</h2>
              <p className="text-muted-foreground leading-relaxed">Los productos están sujetos a confirmación de disponibilidad por parte de un asesor comercial. Los precios están expresados en pesos colombianos (COP) e incluyen IVA cuando aplica. El pago se procesa a través de Wompi, plataforma certificada y segura. La compra se formaliza una vez confirmada la disponibilidad y procesado el pago exitosamente.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">3. Envíos y entregas</h2>
              <p className="text-muted-foreground leading-relaxed">Los tiempos de entrega estimados son de 2 a 5 días hábiles para Bogotá y de 5 a 10 días hábiles para el resto de Colombia. El cliente es responsable de proporcionar una dirección de entrega correcta y completa. Netpower IT no se hace responsable por demoras causadas por información incorrecta o factores externos como fuerza mayor.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">4. Devoluciones</h2>
              <p className="text-muted-foreground leading-relaxed">Netpower IT acepta devoluciones dentro de los 15 días hábiles siguientes a la entrega, siempre que el producto esté en perfectas condiciones con empaque original y todos sus accesorios. Para iniciar el proceso: <a href="mailto:aosorio@netpowerit.co" className="underline hover:text-primary">aosorio@netpowerit.co</a>. No se aceptan devoluciones de software con licencia activada.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">5. Garantías</h2>
              <p className="text-muted-foreground leading-relaxed">Todos los productos cuentan con garantía directamente con el fabricante, sobre factura de compra. El tiempo de garantía varía según el fabricante. Netpower IT actúa como intermediario para facilitar el trámite de garantía.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">6. Ley aplicable</h2>
              <p className="text-muted-foreground leading-relaxed">Estos términos se rigen por la legislación colombiana. Cualquier disputa será sometida a la jurisdicción de los tribunales competentes de Bogotá, Colombia.</p>
            </section>
          </div>
        )}
 
        {/* Tratamiento de Datos */}
        {active === "Tratamiento de Datos" && (
          <div className="space-y-6">
            <p className="text-xs text-muted-foreground">Conforme a la Ley 1581 de 2012 y el Decreto 1074 de 2015 — República de Colombia</p>
 
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">1. Responsable del tratamiento</h2>
              <p className="text-muted-foreground leading-relaxed">Netpower IT es el responsable del tratamiento de los datos personales recopilados a través de este sitio. Contacto: <a href="mailto:aosorio@netpowerit.co" className="underline hover:text-primary">aosorio@netpowerit.co</a> · <a href="https://wa.me/573018417896" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">+57 301 841 7896</a>.</p>
            </section>
 
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">2. Datos que recopilamos</h2>
              <p className="text-muted-foreground leading-relaxed">Recopilamos los siguientes datos cuando el usuario realiza una compra o solicita una cotización: nombre completo, correo electrónico, teléfono, dirección de entrega e historial de pedidos.</p>
            </section>
 
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">3. Finalidad del tratamiento</h2>
              <p className="text-muted-foreground leading-relaxed">Los datos se usan para: procesar pedidos, enviar confirmaciones, brindar soporte posventa, mejorar nuestros servicios y realizar comunicaciones comerciales sobre productos, promociones y novedades.</p>
            </section>
 
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-5 rounded-r-xl">
              <p className="font-bold text-gray-900 mb-2">⚠️ AUTORIZACIÓN EXPRESA</p>
              <p className="text-gray-800 text-sm leading-relaxed">
                Al registrarse, solicitar una cotización o realizar una compra en este sitio web, el usuario otorga autorización expresa e inequívoca a Netpower IT para contactarlo mediante{" "}
                <strong>mensajes de texto (SMS), mensajes de WhatsApp y correos electrónicos</strong>{" "}
                con información sobre sus pedidos, novedades del catálogo, promociones especiales y comunicaciones comerciales. Esta autorización puede ser revocada en cualquier momento escribiendo a{" "}
                <a href="mailto:aosorio@netpowerit.co" className="underline">aosorio@netpowerit.co</a>.
              </p>
            </div>
 
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">4. Derechos del titular</h2>
              <p className="text-muted-foreground leading-relaxed">Conforme a la Ley 1581 de 2012, tiene derecho a conocer, actualizar, rectificar y solicitar la supresión de sus datos. Escríbanos a <a href="mailto:aosorio@netpowerit.co" className="underline hover:text-primary">aosorio@netpowerit.co</a>.</p>
            </section>
 
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">5. Seguridad y transferencia</h2>
              <p className="text-muted-foreground leading-relaxed">Los datos se almacenan en servidores seguros con cifrado. No vendemos, alquilamos ni transferimos datos personales a terceros sin consentimiento explícito, salvo obligación legal o para gestionar la entrega del pedido.</p>
            </section>
          </div>
        )}
 
        {/* Política de Cookies */}
        {active === "Política de Cookies" && (
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">1. ¿Qué son las cookies?</h2>
              <p className="text-muted-foreground leading-relaxed">Las cookies son pequeños archivos de texto que los sitios web almacenan en el navegador para recordar preferencias, sesiones y comportamiento de navegación.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">2. Cookies que utilizamos</h2>
              <p className="text-muted-foreground leading-relaxed mb-3"><strong>Técnicas esenciales:</strong> Necesarias para el funcionamiento del carrito de compras, sesión de usuario y preferencias. Sin estas el sitio no funciona correctamente.</p>
              <p className="text-muted-foreground leading-relaxed"><strong>Analíticas:</strong> Usamos Google Analytics 4 (ID: G-MWRV7ZNCB9) para medir tráfico y comportamiento. No recopila datos personales identificables.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">3. Sin publicidad de terceros</h2>
              <p className="text-muted-foreground leading-relaxed">Netpower IT no utiliza cookies de publicidad de terceros ni redes de seguimiento publicitario.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">4. Gestión de cookies</h2>
              <p className="text-muted-foreground leading-relaxed">Puedes desactivar o eliminar las cookies desde la configuración de tu navegador. Desactivar las cookies técnicas puede afectar el funcionamiento del carrito y otras funcionalidades esenciales.</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">5. Contacto</h2>
              <p className="text-muted-foreground leading-relaxed">Consultas sobre cookies: <a href="mailto:aosorio@netpowerit.co" className="underline hover:text-primary">aosorio@netpowerit.co</a>.</p>
            </section>
          </div>
        )}
 
        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Última actualización: marzo 2026 ·{" "}
            <Link to="/" className="underline hover:text-primary">Volver al inicio</Link>
          </p>
        </div>
      </div>
    </>
  );
}
