import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "success" | "pending" | "error";

export default function PaymentResult() {
  const [params] = useSearchParams();
  const orderId = params.get("order") || "—";
  const wompiTxId = params.get("id"); // present when Wompi redirects back
  const explicitStatus = params.get("status"); // 'pending' for manual transfers

  const [status, setStatus] = useState<Status>(
    wompiTxId ? "loading" : (explicitStatus === "pending" ? "pending" : "loading")
  );

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      // Manual transfer flow → already explicit
      if (!wompiTxId && explicitStatus === "pending") {
        setStatus("pending");
        return;
      }

      // Wompi flow → verify against Wompi via edge function (NEVER trust URL alone)
      if (wompiTxId) {
        try {
          const { data, error } = await supabase.functions.invoke("verify-wompi-transaction", {
            body: { transactionId: wompiTxId, reference: orderId },
          });
          if (cancelled) return;
          if (error) throw error;

          if (data?.status === "APPROVED") setStatus("success");
          else if (data?.status === "PENDING") setStatus("pending");
          else setStatus("error");
        } catch (e) {
          console.error("Wompi verification failed:", e);
          if (!cancelled) setStatus("error");
        }
        return;
      }

      // No tx id and no explicit pending → check the order in DB as a fallback
      if (orderId && orderId !== "—") {
        const { data } = await supabase
          .from("orders")
          .select("status")
          .eq("reference", orderId)
          .maybeSingle();
        if (cancelled) return;
        if (data?.status === "completed") setStatus("success");
        else if (data?.status === "pending_verification" || data?.status === "pending") setStatus("pending");
        else setStatus("error");
      } else {
        setStatus("error");
      }
    };

    verify();
    return () => { cancelled = true; };
  }, [wompiTxId, orderId, explicitStatus]);

  return (
    <>
      <Helmet>
        <title>Resultado del Pago | Netpower IT</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="container mx-auto px-4 py-16 max-w-xl">
        <div className="bg-card rounded-2xl border border-border shadow-card p-8">
          {status === "loading" && (
            <div className="text-center space-y-4 py-8">
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
              <p className="text-muted-foreground">Verificando tu pago…</p>
            </div>
          )}

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
              <h1 className="text-2xl font-bold text-foreground">No pudimos confirmar tu pago</h1>
              <p className="text-muted-foreground">
                La transacción no fue aprobada o no pudo verificarse. No se confirmó el pedido.
                Si ya pagaste, contáctanos con tu número de referencia.
              </p>
              {orderId !== "—" && <p className="text-lg font-mono text-foreground">{orderId}</p>}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/checkout" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition">
                  Reintentar pago
                </Link>
                <a
                  href="https://wa.me/573018417896"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-success text-success-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
                >
                  Contactar por WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
