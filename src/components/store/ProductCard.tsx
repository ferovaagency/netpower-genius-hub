import { Link } from "react-router-dom";
import { MessageCircle, ShoppingCart } from "lucide-react";
import { Product } from "@/types/store";
import { formatCOP, getDiscountPercentage, categories } from "@/data/store-data";
import { useCart } from "@/contexts/CartContext";

const WHATSAPP_NUMBER = "573504609431";

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
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-hover">
      <Link
        to={`/producto/${product.slug}`}
        aria-label={`Ver ${product.name}`}
        className="relative flex aspect-square items-center justify-center overflow-hidden bg-white outline outline-1 -outline-offset-1 outline-black/10 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary"
      >
        {product.images && product.images.length > 0 && product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain p-5 transition-transform duration-300 group-hover:scale-[1.03]"
          />
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

      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">SKU: {product.sku || "No disponible"}</p>
        <Link to={`/producto/${product.slug}`} className="line-clamp-2 min-h-[2.75rem] rounded-sm text-sm font-bold leading-snug text-card-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
          {product.name}
        </Link>
        {product.shortDesc && <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{product.shortDesc}</p>}

        <div className="mt-auto pt-3">
          {showQuote ? (
            <p className="text-sm font-bold text-secondary">Precio y disponibilidad bajo consulta</p>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-extrabold tabular-nums text-foreground">
                  {formatCOP(product.salePrice || product.price)}
                </span>
                {product.salePrice && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatCOP(product.price)}
                  </span>
                )}
              </div>
              <p className={`mt-1 text-xs font-semibold ${product.stock !== null && product.stock > 5 ? "text-success" : "text-secondary"}`}>
                {product.stock !== null && product.stock > 5 ? "Disponible" : `${product.stock} disponibles`}
              </p>
            </>
          )}
        </div>

        {showQuote ? (
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`}
            data-wa-origen="tarjeta_producto"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-success text-sm font-bold text-success-foreground transition-opacity duration-150 hover:opacity-90 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2"
          >
            <MessageCircle className="w-4 h-4" /> Cotizar por WhatsApp
          </a>
        ) : (
          <button
            onClick={() => addItem(product)}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-button transition-opacity duration-150 hover:opacity-90 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Agregar al carrito
          </button>
        )}

        <p className="mt-1 border-t border-border pt-2 text-center text-[11px] font-medium text-muted-foreground">Envío nacional · Garantía oficial</p>
      </div>
    </article>
  );
}
