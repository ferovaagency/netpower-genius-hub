import { Helmet } from "react-helmet-async";

export default function PoliticaDatosPage() {
  return (
    <>
      <Helmet>
        <title>Política de Tratamiento de Datos Personales | Netpower IT SAS</title>
        <meta
          name="description"
          content="Política de Tratamiento de Datos Personales de Netpower IT SAS conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013."
        />
        <link rel="canonical" href="https://netpowerit.co/politica-datos" />
      </Helmet>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-extrabold text-foreground mb-3">
          Política de Tratamiento de Datos Personales
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Netpower IT SAS · NIT 901.881.682-0 · AK 7 #156-80, NorthPoint Torre 2, Oficina 1004, Bogotá D.C., Colombia ·{" "}
          <a href="mailto:aosorio@netpowerit.co" className="underline hover:text-primary">
            aosorio@netpowerit.co
          </a>{" "}
          · +57 350 460 9431
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">1. Responsable del tratamiento</h2>
            <p className="text-muted-foreground leading-relaxed">
              Netpower IT SAS, identificada con NIT 901.881.682-0, con domicilio en la AK 7 #156-80, NorthPoint Torre 2,
              Oficina 1004, Bogotá D.C.,
              Colombia, es responsable del tratamiento de los datos personales recolectados a través de su sitio web,
              formularios, canales de venta y su asesor de inteligencia artificial. Esta política se rige por la Ley
              1581 de 2012, el Decreto 1377 de 2013 y demás normas aplicables.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">2. Autorización</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mediante la aceptación de esta política, el titular autoriza de manera previa, expresa e informada a
              Netpower IT SAS para recolectar, almacenar, usar, actualizar, circular y suprimir sus datos personales
              conforme a la Ley 1581 de 2012 y demás normas aplicables.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">3. Finalidades</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">La información suministrada será utilizada para:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Contacto y atención de solicitudes.</li>
              <li>Gestión administrativa y comercial.</li>
              <li>Envío de información relacionada con los servicios ofrecidos.</li>
              <li>Encuestas de satisfacción y mejoramiento de la calidad.</li>
              <li>Cumplimiento de obligaciones legales y contractuales.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">4. Derechos del titular</h2>
            <p className="text-muted-foreground leading-relaxed">
              El titular ha sido informado de que puede ejercer sus derechos de conocer, actualizar, rectificar y
              solicitar la supresión de sus datos personales, así como revocar la presente autorización cuando sea
              procedente, conforme a la ley.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">5. Canales de atención</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para ejercer sus derechos o realizar consultas y reclamos sobre el tratamiento de sus datos, el titular
              puede comunicarse al correo{" "}
              <a href="mailto:aosorio@netpowerit.co" className="underline hover:text-primary">
                aosorio@netpowerit.co
              </a>{" "}
              o al teléfono +57 350 460 9431.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 border-b border-border pb-2">6. Vigencia</h2>
            <p className="text-muted-foreground leading-relaxed">
              Esta política rige a partir de su publicación. Los datos personales se conservarán durante el tiempo
              necesario para cumplir las finalidades descritas y las obligaciones legales aplicables.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
