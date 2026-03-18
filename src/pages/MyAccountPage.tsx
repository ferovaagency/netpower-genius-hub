import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function MyAccountPage() {
  const [email, setEmail] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");

  const statusLabel: Record<string, string> = {
    pending: "Pendiente de confirmación",
    paid: "Pago confirmado",
    shipped: "En camino",
    delivered: "Entregado",
    cancelled: "Cancelado",
  };

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-blue-100 text-blue-800",
    shipped: "bg-orange-100 text-orange-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const handleSearch = async () => {
    if (!email.trim() || !reference.trim()) {
      setError("Por favor ingresa tu email y número de pedido.");
      return;
    }
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_email", email.trim().toLowerCase())
        .eq("reference", reference.trim().toUpperCase())
        .maybeSingle();
      if (data) {
        setOrder(data);
      } else {
        setError("No encontramos un pedido con esos datos. Verifica tu email y código de pedido.");
      }
    } catch {
      setError("Error al buscar el pedido. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Mi Cuenta | Netpower IT</title>
        <meta name="description" content="Consulta el estado de tu pedido en Netpower IT." />
      </Helmet>
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Consultar mi pedido</h1>
            <p className="text-sm text-muted-foreground">Ingresa tu email y código de pedido</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Correo electrónico</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Código de pedido</label>
            <Input
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="Ej: NP-1742123456-ABC123"
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSearch} disabled={loading} className="w-full">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Buscando...</> : <><Search className="w-4 h-4 mr-2" /> Buscar pedido</>}
          </Button>
        </div>

        {order && (
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Código de pedido</p>
                <p className="text-xl font-bold font-mono text-primary">{order.reference}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor[order.status] || "bg-gray-100 text-gray-700"}`}>
                {statusLabel[order.status] || order.status}
              </span>
            </div>

            <div className="text-sm space-y-1.5">
              <p><span className="font-semibold">Cliente:</span> {order.customer_name}</p>
              <p><span className="font-semibold">Email:</span> {order.customer_email}</p>
              <p><span className="font-semibold">Fecha:</span> {new Date(order.created_at).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Productos</p>
              <div className="rounded-xl border border-border overflow-hidden">
                {Array.isArray(order.items) && order.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center px-4 py-3 text-sm border-b border-border last:border-0">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Cantidad: {item.quantity}</p>
                    </div>
                    <span className="font-semibold">${(item.price * item.quantity).toLocaleString("es-CO")} COP</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-3 bg-muted/30 font-bold text-sm">
                  <span>Total pagado</span>
                  <span>${(order.total || 0).toLocaleString("es-CO")} COP</span>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 text-sm">
              <p className="font-semibold mb-1">¿Tienes dudas sobre tu pedido?</p>
              <p className="text-muted-foreground text-xs mb-3">Nuestro equipo te ayuda por WhatsApp</p>
              <a
                href={`https://wa.me/573018417896?text=${encodeURIComponent(`Hola, consulto por mi pedido ${order.reference}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition"
              >
                Escribir por WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
