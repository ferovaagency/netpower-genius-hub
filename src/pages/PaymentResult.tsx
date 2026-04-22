import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function PaymentResult() {
  const [params] = useSearchParams();
  const status = params.get("status") || "success";
  const orderId = params.get("order") || "—";

  return (
    <>
      <Helmet>
        <title>Resultado del Pago | Netpower IT</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="container mx-auto px-4 py-16 max-w-xl">
        <div className="bg-card rounded-2xl border border-border shadow-card p-8">
          {status === "success" && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">¡Pago confirmado!</h1>
              <p className="text-muted-foreground">Tu pedido fue procesado con éxito.</p>
              <p className="text-3xl font-bold text-primary font-mono">{orderId}</p>
              <Link to="/" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition">
                Volver al inicio
              </Link>
            </div>
          )}

          {status === "pending" && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-secondary/15 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl">⏳</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">¡Pedido recibido!</h1>
              <p className="text-muted-foreground">Tu número de pedido es:</p>
              <p className="text-3xl font-bold text-primary font-mono">{orderId}</p>
              <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-4 text-sm text-foreground text-left">
                <p className="font-semibold mb-2">¿Qué sigue?</p>
                <ol className="space-y-1 list-decimal list-inside text-muted-foreground">
                  <li>Revisamos tu comprobante de pago</li>
                  <li>Te confirmamos por WhatsApp en máx. 2 horas hábiles</li>
                  <li>Procesamos y despachamos tu pedido</li>
                </ol>
              </div>
              <a
                href="https://wa.me/573018417896"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-success text-success-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
              >
                Verificar estado por WhatsApp
              </a>
            </div>
          )}

          {status === "error" && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-10 h-10 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Hubo un problema</h1>
              <p className="text-muted-foreground">No pudimos procesar tu pedido. Intenta de nuevo o contáctanos.</p>
              <a
                href="https://wa.me/573018417896"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-success text-success-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
              >
                Contactar por WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
