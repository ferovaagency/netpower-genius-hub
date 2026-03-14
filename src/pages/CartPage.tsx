import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Trash2, Minus, Plus, ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatCOP } from "@/data/store-data";
import { categories } from "@/data/store-data";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();

  const iva = Math.round(totalPrice * 0.19);
  const total = totalPrice + iva;

  return (
    <>
      <Helmet>
        <title>Carrito de Compras | NetPower IT</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition">Inicio</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Carrito</span>
        </nav>

        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-8">Carrito de Compras</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">Tu carrito está vacío</p>
            <p className="text-sm text-muted-foreground mb-6">Agrega productos desde nuestra tienda</p>
            <Link to="/tienda" className="inline-flex h-10 px-6 items-center gap-2 rounded-full bg-gradient-secondary text-secondary-foreground font-semibold shadow-button hover:shadow-lg transition-all">
              Ir a la Tienda <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map(item => {
                const cat = categories.find(c => c.id === item.product.categoryId);
                const unitPrice = item.product.salePrice || item.product.price;
                return (
                  <div key={item.product.id} className="flex gap-4 p-4 bg-card rounded-xl border border-border shadow-card">
                    <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center text-3xl shrink-0">
                      {cat?.icon || "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/producto/${item.product.slug}`} className="font-semibold text-sm text-card-foreground hover:text-primary transition line-clamp-1">
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-muted-foreground font-mono">SKU: {item.product.sku}</p>
                      <p className="text-sm font-bold text-foreground mt-1">{formatCOP(unitPrice)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button onClick={() => removeItem(item.product.id)} className="text-muted-foreground hover:text-destructive transition p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center border border-border rounded-lg overflow-hidden">
                        <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-muted transition">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 h-8 flex items-center justify-center text-xs font-semibold border-x border-border">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-muted transition">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-foreground">{formatCOP(unitPrice * item.quantity)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 bg-card rounded-xl border border-border shadow-card p-6 space-y-4">
                <h2 className="font-bold text-foreground">Resumen del Pedido</h2>
                <div className="space-y-2 text-sm">
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
                    <span className="text-sm text-success font-medium">Calcular en checkout</span>
                  </div>
                </div>
                <div className="border-t border-border pt-4 flex justify-between">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="text-xl font-extrabold text-foreground">{formatCOP(total)}</span>
                </div>
                <button className="w-full h-12 rounded-lg bg-gradient-secondary text-secondary-foreground font-semibold shadow-button hover:shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
                  Proceder al Pago <ArrowRight className="w-4 h-4" />
                </button>
                <Link to="/tienda" className="block text-center text-sm text-primary hover:underline mt-2">
                  Continuar comprando
                </Link>
                <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground pt-2">
                  <span>🔒 Compra segura</span>
                  <span>•</span>
                  <span>✓ Garantía oficial</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
