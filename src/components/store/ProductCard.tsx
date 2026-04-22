import { Link } from "react-router-dom";
import { ShoppingCart, Eye, Heart, MessageCircle } from "lucide-react";
import { Product } from "@/types/store";
import { formatCOP, getDiscountPercentage, categories } from "@/data/store-data";
import { useCart } from "@/contexts/CartContext";

const WHATSAPP_NUMBER = "573018417896";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const discount = getDiscountPercentage(product.price, product.salePrice);
  const category = categories.find(c => c.id === product.categoryId);
  const isServer = category?.slug === "servidores";
  // Producto sin stock asignado (null) o sin precio → "Consultar precio"
  // stock === 0 también se trata como "consultar" para mostrar CTA WhatsApp
  const needsQuote =
    product.stock === null ||
    product.stock === undefined ||
    product.stock === 0 ||
    !product.price ||
    product.price === 0;
  const showQuote = isServer || needsQuote;

  const waMessage = encodeURIComponent(`Hola Netpower IT, quisiera cotizar: ${product.name} (SKU: ${product.sku || "N/A"})`);

  return (
    <div className="group bg-card rounded-xl border border-border shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden flex flex-col">
      {/* Image area */}
      <div className="relative aspect-square bg-muted/50 flex items-center justify-center overflow-hidden">
        {product.images && product.images.length > 0 && product.images[0] ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-4" />
        ) : (
          <div className="text-4xl">{category?.icon || "📦"}</div>
        )}

        {!showQuote && discount && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
            -{discount}%
          </span>
        )}

        {!showQuote && product.stock !== null && product.stock <= 5 && product.stock > 0 && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-[10px] font-semibold animate-pulse-soft">
            Últimas unidades
          </span>
        )}

        {showQuote && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
            Consultar precio
          </span>
        )}

        <div className="absolute inset-0 bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Link
            to={`/producto/${product.slug}`}
            className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition shadow-sm"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-destructive hover:text-destructive-foreground transition shadow-sm">
            <Heart className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">SKU: {product.sku}</p>
        <Link to={`/producto/${product.slug}`} className="font-semibold text-sm leading-snug text-card-foreground hover:text-primary transition line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </Link>
        <p className="text-xs text-muted-foreground line-clamp-1">{product.shortDesc}</p>

        <div className="mt-auto pt-3">
          {showQuote ? (
            <p className="text-sm font-semibold text-secondary">Consulte disponibilidad y precio</p>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-extrabold text-foreground">
                  {formatCOP(product.salePrice || product.price)}
                </span>
                {product.salePrice && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatCOP(product.price)}
                  </span>
                )}
              </div>
              <p className={`text-xs mt-1 font-medium ${product.stock !== null && product.stock > 5 ? "text-success" : "text-secondary"}`}>
                {product.stock !== null && product.stock > 5 ? "En stock" : `Solo ${product.stock} disponibles`}
              </p>
            </>
          )}
        </div>

        {showQuote ? (
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 w-full h-10 rounded-lg bg-success text-success-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
          >
            <MessageCircle className="w-4 h-4" /> Cotizar por WhatsApp
          </a>
        ) : (
          <button
            onClick={() => addItem(product)}
            className="mt-3 w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-button hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Agregar al carrito
          </button>
        )}
      </div>
    </div>
  );
}
