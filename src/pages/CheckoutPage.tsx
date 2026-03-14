import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ShieldCheck, Truck, CreditCard, Loader2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatCOP, categories, findProductById, decreaseInventory } from "@/data/store-data";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", idType: "CC", idNumber: "",
    address: "", city: "", department: "", notes: "",
  });

  const iva = Math.round(totalPrice * 0.19);
  const shipping = totalPrice > 500000 ? 0 : 25000;
  const total = totalPrice + iva + shipping;

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const isValid = form.name && form.email && form.phone && form.idNumber && form.address && form.city && form.department;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) { toast.error("Completa todos los campos obligatorios"); return; }
    setLoading(true);

    // Build WhatsApp message with order details
    const itemLines = items.map(i => {
      const p = i.product;
      return `• ${p.name} (x${i.quantity}) - ${formatCOP((p.salePrice || p.price) * i.quantity)}`;
    }).join("\n");

    const msg = `🛒 *NUEVO PEDIDO - NetPower IT*\n\n` +
      `👤 *Cliente:* ${form.name}\n📧 ${form.email}\n📱 ${form.phone}\n🪪 ${form.idType} ${form.idNumber}\n\n` +
      `📍 *Envío:*\n${form.address}\n${form.city}, ${form.department}\n\n` +
      `📦 *Productos:*\n${itemLines}\n\n` +
      `💰 Subtotal: ${formatCOP(totalPrice)}\n💰 IVA (19%): ${formatCOP(iva)}\n🚚 Envío: ${shipping === 0 ? "GRATIS" : formatCOP(shipping)}\n` +
      `💵 *TOTAL: ${formatCOP(total)}*\n\n${form.notes ? `📝 Notas: ${form.notes}` : ""}`;

    const waUrl = `https://wa.me/573018417895?text=${encodeURIComponent(msg)}`;

    setTimeout(() => {
      setLoading(false);
      clearCart();
      window.open(waUrl, "_blank");
      toast.success("¡Pedido enviado! Te contactaremos para confirmar el pago.");
      navigate("/");
    }, 1500);
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-lg font-semibold text-foreground mb-4">Tu carrito está vacío</p>
        <Link to="/tienda" className="text-primary hover:underline">Ir a la tienda</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout | Netpower IT</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <Link to="/carrito" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver al carrito
        </Link>

        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-8">Finalizar Compra</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
              <h2 className="font-bold text-foreground text-lg">Información del Cliente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Nombre completo *</label>
                  <input type="text" value={form.name} onChange={e => update("name", e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={e => update("email", e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Teléfono *</label>
                  <input type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition" required />
                </div>
                <div className="flex gap-2">
                  <div className="w-24">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Doc *</label>
                    <select value={form.idType} onChange={e => update("idType", e.target.value)} className="w-full h-10 px-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition">
                      <option value="CC">CC</option>
                      <option value="NIT">NIT</option>
                      <option value="CE">CE</option>
                      <option value="PP">PP</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Número *</label>
                    <input type="text" value={form.idNumber} onChange={e => update("idNumber", e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition" required />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
              <h2 className="font-bold text-foreground text-lg flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> Dirección de Envío</h2>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Dirección *</label>
                <input type="text" value={form.address} onChange={e => update("address", e.target.value)} placeholder="Calle, número, barrio" className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Ciudad *</label>
                  <input type="text" value={form.city} onChange={e => update("city", e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Departamento *</label>
                  <input type="text" value={form.department} onChange={e => update("department", e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Notas del pedido</label>
                <textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="Instrucciones especiales de entrega..." rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-none" />
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 bg-card rounded-xl border border-border shadow-card p-6 space-y-4">
              <h2 className="font-bold text-foreground">Resumen del Pedido</h2>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {items.map(item => {
                  const cat = categories.find(c => c.id === item.product.categoryId);
                  const unitPrice = item.product.salePrice || item.product.price;
                  return (
                    <div key={item.product.id} className="flex gap-3 text-sm">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">
                        {cat?.icon || "📦"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                      </div>
                      <span className="font-semibold text-foreground text-xs">{formatCOP(unitPrice * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-border pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{formatCOP(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA (19%)</span>
                  <span className="font-medium text-foreground">{formatCOP(iva)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Envío</span>
                  <span className={`font-medium ${shipping === 0 ? "text-success" : "text-foreground"}`}>
                    {shipping === 0 ? "GRATIS" : formatCOP(shipping)}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-[10px] text-muted-foreground">Envío gratis en compras mayores a $500.000</p>
                )}
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-bold text-foreground">Total</span>
                <span className="text-xl font-extrabold text-foreground">{formatCOP(total)}</span>
              </div>

              <button
                type="submit"
                disabled={loading || !isValid}
                className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold shadow-button hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
                ) : (
                  <><CreditCard className="w-5 h-5" /> Confirmar Pedido</>
                )}
              </button>

              <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground pt-1">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Compra segura</span>
                <span>•</span>
                <span>✓ Garantía oficial</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
