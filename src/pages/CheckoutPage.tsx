import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ShieldCheck, Truck, CreditCard, Loader2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatCOP, categories, findProductById, decreaseInventory } from "@/data/store-data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WHATSAPP = "573018417896";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"" | "wompi" | "bancolombia" | "nequi" | "daviplata" | "breb">("");
  const [receipt, setReceipt] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", idType: "CC", idNumber: "",
    address: "", city: "", department: "", notes: "",
  });

  // Los precios ya incluyen IVA — no se suma
  const subtotal = totalPrice;
  const total = subtotal;

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const isFormValid = !!(form.name && form.email && form.phone && form.idNumber && form.address && form.city && form.department);
  const requiresReceipt = ["bancolombia", "nequi", "daviplata", "breb"].includes(paymentMethod);

  const validateStock = () => {
    // Solo bloquea si el producto está en data local Y no cumple. Productos de Supabase pasan.
    const stockIssue = items.find((item) => {
      const latest = findProductById(item.product.id);
      if (!latest) return false; // Producto de Supabase: no validar contra data local
      if (!latest.active) return true;
      if (latest.stock === null || latest.stock === undefined) return false; // sin stock asignado: permitido
      return latest.stock < item.quantity;
    });
    return stockIssue;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) { toast.error("Completa todos los campos obligatorios"); return; }
    if (!paymentMethod) { toast.error("Selecciona un método de pago"); return; }
    if (requiresReceipt && !receipt) { toast.error("Sube tu comprobante de pago"); return; }
    if (requiresReceipt && receipt && receipt.size > 5 * 1024 * 1024) {
      toast.error("El comprobante no puede superar 5MB"); return;
    }

    const stockIssue = validateStock();
    if (stockIssue) {
      toast.error(`Inventario insuficiente para "${stockIssue.product.name}". Ajusta tu carrito.`);
      navigate("/carrito");
      return;
    }

    setLoading(true);

    try {
      const orderRef = `ORD-${Date.now()}`;

      const orderItems = items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        sku: i.product.sku,
        quantity: i.quantity,
        unitPrice: i.product.salePrice || i.product.price,
      }));

      const shippingAddress = {
        address: form.address,
        city: form.city,
        department: form.department,
        idType: form.idType,
        idNumber: form.idNumber,
        notes: form.notes,
      };

      // ─── Wompi: create signed checkout and redirect (NO confirmation here) ───
      if (paymentMethod === "wompi") {
        const { data, error } = await supabase.functions.invoke("create-wompi-checkout", {
          body: {
            reference: orderRef,
            amountCOP: total,
            customer: { name: form.name, email: form.email, phone: form.phone },
            items: orderItems,
            shipping_address: shippingAddress,
            redirectBaseUrl: window.location.origin,
          },
        });
        if (error) throw error;
        if (!data?.checkoutUrl) throw new Error("No se pudo generar el enlace de pago");

        // Redirect to Wompi — payment must complete there before order is confirmed
        window.location.href = data.checkoutUrl;
        return;
      }

      // ─── Manual transfer methods: upload receipt + create order pending_verification ───
      let receiptUrl: string | null = null;
      if (requiresReceipt && receipt) {
        const ext = receipt.name.split(".").pop() || "bin";
        const filePath = `${orderRef}/comprobante.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("receipts")
          .upload(filePath, receipt, { upsert: true });
        if (uploadErr) throw uploadErr;
        receiptUrl = supabase.storage.from("receipts").getPublicUrl(filePath).data.publicUrl;
      }

      const { error: orderErr } = await supabase.from("orders").insert({
        reference: orderRef,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        customer_city: form.city,
        items: orderItems,
        total,
        status: "pending_verification",
        payment_method: paymentMethod,
        payment_provider: "manual",
        receipt_url: receiptUrl,
        shipping_address: shippingAddress,
      });
      if (orderErr) throw orderErr;

      decreaseInventory(items.map((item) => ({ productId: item.product.id, quantity: item.quantity })));

      const itemLines = items
        .map((i) => `• ${i.product.name} (x${i.quantity}) - ${formatCOP((i.product.salePrice || i.product.price) * i.quantity)}`)
        .join("\n");

      const methodLabel = {
        bancolombia: "Transferencia Bancolombia",
        nequi: "Nequi",
        daviplata: "Daviplata",
        breb: "Bre-b",
      }[paymentMethod as "bancolombia" | "nequi" | "daviplata" | "breb"];

      const msg =
        `🛒 *NUEVO PEDIDO #${orderRef} - NetPower IT*\n\n` +
        `👤 *Cliente:* ${form.name}\n📧 ${form.email}\n📱 ${form.phone}\n🪪 ${form.idType} ${form.idNumber}\n\n` +
        `📍 *Envío:*\n${form.address}\n${form.city}, ${form.department}\n\n` +
        `📦 *Productos:*\n${itemLines}\n\n` +
        `💵 *TOTAL: ${formatCOP(total)}* (IVA incluido, envío a calcular)\n\n` +
        `💳 *Método:* ${methodLabel}\n` +
        (receiptUrl ? `📎 Comprobante: ${receiptUrl}\n` : "") +
        (form.notes ? `\n📝 Notas: ${form.notes}` : "");

      const waUrl = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;

      clearCart();
      window.open(waUrl, "_blank");

      toast.success("¡Pedido recibido! Verificaremos tu comprobante.");
      navigate(`/resultado-pago?order=${orderRef}&status=pending`);
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error("Error al procesar el pedido. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-lg font-semibold text-foreground mb-4">Tu carrito está vacío</p>
        <Link to="/tienda" className="text-primary hover:underline">Ir a la tienda</Link>
      </div>
    );
  }

  const PaymentOption = ({ value, icon, title, subtitle }: { value: typeof paymentMethod; icon: string; title: string; subtitle: string }) => (
    <label className={`flex items-start gap-3 border-2 rounded-xl p-4 cursor-pointer transition-all ${
      paymentMethod === value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
    }`}>
      <input type="radio" name="payment" value={value} checked={paymentMethod === value}
        onChange={() => setPaymentMethod(value)} className="mt-1" />
      <div>
        <p className="font-semibold text-foreground">{icon} {title}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </label>
  );

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

            {/* Método de pago */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-4">
              <h2 className="font-bold text-foreground text-lg flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Método de Pago</h2>
              <div className="space-y-3">
                <PaymentOption value="wompi" icon="💳" title="Wompi" subtitle="Tarjeta crédito o débito — pago inmediato y verificado" />
                <PaymentOption value="bancolombia" icon="🏦" title="Transferencia Bancolombia" subtitle="Transfiere y sube tu comprobante" />
                <PaymentOption value="nequi" icon="📱" title="Nequi" subtitle="Transfiere y sube tu comprobante" />
                <PaymentOption value="daviplata" icon="📱" title="Daviplata" subtitle="Transfiere y sube tu comprobante" />
                <PaymentOption value="breb" icon="🔑" title="Bre-b" subtitle="Transfiere con tu llave Bre-b y sube tu comprobante" />
              </div>

              {requiresReceipt && (
                <div className="bg-muted rounded-xl p-4 mt-2 space-y-3">
                  {paymentMethod === "bancolombia" && (
                    <div className="text-sm space-y-1.5 text-muted-foreground">
                      <p className="font-semibold text-foreground">Datos para transferencia:</p>
                      <p>🏦 Banco: Bancolombia S.A.</p>
                      <p>Tipo: Cuenta de Ahorros</p>
                      <p className="font-mono font-bold text-foreground text-base">Cuenta: 05200002860</p>
                      <p>Titular: NET POWER IT SAS</p>
                      <p>NIT: 901.881.682</p>
                    </div>
                  )}

                  {paymentMethod === "nequi" && (
                    <div className="text-sm space-y-1.5 text-muted-foreground">
                      <p className="font-semibold text-foreground">Datos para transferencia Nequi:</p>
                      <p className="font-mono font-bold text-foreground text-base">📱 315 888 5961</p>
                      <p>Titular: María Calderón</p>
                    </div>
                  )}

                  {paymentMethod === "daviplata" && (
                    <div className="text-sm space-y-1.5 text-muted-foreground">
                      <p className="font-semibold text-foreground">Datos para transferencia Daviplata:</p>
                      <p className="font-mono font-bold text-foreground text-base">📱 315 888 5961</p>
                      <p>Titular: María Calderón</p>
                    </div>
                  )}

                  {paymentMethod === "breb" && (
                    <div className="text-sm space-y-1.5 text-muted-foreground">
                      <p className="font-semibold text-foreground">Datos para Bre-b:</p>
                      <p className="font-mono font-bold text-foreground text-base">🔑 Llave: 0091042041</p>
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-border">
                    <label className="text-sm font-semibold block text-foreground">📎 Subir comprobante de pago *</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                      className="w-full border border-border rounded-lg p-2 text-sm bg-background"
                    />
                    <p className="text-xs text-muted-foreground">Formatos: JPG, PNG o PDF — máximo 5MB</p>
                  </div>

                  <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-3 text-xs text-foreground">
                    ⏳ Una vez recibamos y verifiquemos tu comprobante, confirmaremos tu pedido por WhatsApp en máximo 2 horas hábiles.
                  </div>
                </div>
              )}
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
                  <span className="font-medium text-foreground">{formatCOP(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Envío</span>
                  <span className="font-medium text-muted-foreground italic">A calcular</span>
                </div>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-bold text-foreground">Total</span>
                <span className="text-xl font-extrabold text-primary">{formatCOP(total)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                * Precios incluyen IVA. Envío se calcula al confirmar.
              </p>

              <button
                type="submit"
                disabled={loading || !isFormValid || !paymentMethod || (requiresReceipt && !receipt)}
                className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold shadow-button hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
