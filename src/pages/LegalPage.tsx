import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
 
const tabs = ["Términos y Condiciones", "Envíos", "Tratamiento de Datos", "Política de Cookies", "Promo Tricolor"] as const;
type Tab = typeof tabs[number];
 
export default function LegalPage() {
  const [params] = useSearchParams();
  const [active, setActive] = useState<Tab>("Términos y Condiciones");

  useEffect(() => {
    const t = params.get("tab");
    if (t === "promo-tricolor") setActive("Promo Tricolor");
    else if (t === "datos") setActive("Tratamiento de Datos");
    else if (t === "cookies") setActive("Política de Cookies");
    else if (t === "envios") setActive("Envíos");
  }, [params]);

 
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
              <p className="text-muted-foreground leading-relaxed">
                Realizamos envíos a todo Colombia. Envío gratis en Bogotá. Los tiempos, tarifas por zona, productos con
                cotización especial (UPS de alta capacidad, servidores en rack) y condiciones de entrega están detallados
                en nuestra <button onClick={() => setActive("Envíos")} className="underline hover:text-primary font-semibold">Política de Envíos</button>.
              </p>
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
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Netpower IT SAS (NIT 901.881.682-0) trata los datos personales conforme a la Ley 1581 de 2012. Consulta la
              política completa, finalidades y tus derechos como titular en la página oficial.
            </p>
            <Link
              to="/politica-datos"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
            >
              Ver Política de Tratamiento de Datos Personales →
            </Link>
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

        {/* Promo Tricolor */}
        {active === "Promo Tricolor" && (
          <div className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              Términos y Condiciones de la Promoción: <strong>"Regalos por tus Compras en Julio"</strong>. Al participar,
              el usuario acepta estos términos en su totalidad.
            </p>
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">1. Vigencia</h2>
              <p className="text-muted-foreground leading-relaxed">
                La promoción está vigente exclusivamente desde el <strong>1 de julio de 2026</strong> hasta el
                <strong> 31 de julio de 2026 a las 11:59 p.m.</strong>, o hasta agotar existencias de los obsequios
                disponibles (lo que ocurra primero).
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">2. Mecánica y montos</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Por compras acumuladas en un mismo pedido, el cliente recibirá un obsequio según el valor de su factura
                (valores en COP - Pesos Colombianos):
              </p>
              <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc pl-5">
                <li><strong>$1.000.000 a $4.999.999:</strong> Un (1) Apuntador Klip Xtreme KPS-006 o un (1) Apuntador Klip Xtreme KPS-005 (sujeto a disponibilidad de inventario).</li>
                <li><strong>$5.000.000 a $9.999.999:</strong> Un (1) Teclado Logitech Pebble Keys 2 K380S.</li>
                <li><strong>$10.000.000 en adelante:</strong> Unos (1) Audífonos Cubbitt Studio en color negro.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">3. Condiciones y restricciones</h2>
              <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc pl-5">
                <li><strong>No acumulable:</strong> los montos corresponden a un único pedido o factura; no se pueden sumar facturas diferentes para alcanzar un rango superior.</li>
                <li><strong>Disponibilidad:</strong> la entrega del obsequio está sujeta al inventario disponible. Para el primer rango, se enviará el modelo KPS-006 o KPS-005 según disponibilidad, sin opción de elección por parte del cliente.</li>
                <li><strong>Garantía de los obsequios:</strong> los productos entregados en calidad de regalo/obsequio no cuentan con cambio por gusto, ni son redimibles por dinero en efectivo, notas crédito o descuentos en la compra. No cuentan con garantía por daños de fábrica, golpes, rayones ni caídas.</li>
                <li><strong>Devoluciones y cancelaciones:</strong> si el cliente solicita la devolución, retracto o cancelación de la compra principal que originó el regalo, deberá devolver también el obsequio en perfecto estado (empaque original sellado y sin usar). De lo contrario, se descontará el valor comercial del obsequio del saldo a devolver.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">4. Despacho y entrega</h2>
              <p className="text-muted-foreground leading-relaxed">
                El obsequio se enviará de manera conjunta con los productos adquiridos en el pedido principal, a la
                dirección de despacho registrada por el cliente.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">5. Cotizaciones</h2>
              <p className="text-muted-foreground leading-relaxed">
                La promoción también aplica a las cotizaciones formales emitidas durante la vigencia, siempre que la
                orden de compra se facture y pague dentro del período vigente y cumpla con los rangos indicados.
              </p>
            </section>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Última actualización: julio 2026 ·{" "}
            <Link to="/" className="underline hover:text-primary">Volver al inicio</Link>
          </p>
        </div>
      </div>
    </>
  );
}


