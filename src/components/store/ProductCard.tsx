import { Link } from "react-router-dom";
import { ShoppingCart, Eye, Heart } from "lucide-react";
import { Product } from "@/types/store";
import { formatCOP, getDiscountPercentage } from "@/data/store-data";
import { useCart } from "@/contexts/CartContext";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const discount = getDiscountPercentage(product.price, product.salePrice);

  return (
    <div className="group bg-card rounded-xl border border-border shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden flex flex-col">
      {/* Image area */}
      <div className="relative aspect-square bg-muted/50 flex items-center justify-center overflow-hidden">
        <div className="text-4xl">{product.categoryId === "1" ? "🔋" : product.categoryId === "2" ? "⚡" : product.categoryId === "3" ? "🌐" : product.categoryId === "4" ? "☀️" : product.categoryId === "5" ? "🖥️" : product.categoryId === "6" ? "📄" : product.categoryId === "7" ? "🖥️" : "🔌"}</div>

        {/* Discount badge */}
        {discount && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
            -{discount}%
          </span>
        )}

        {/* Stock indicator */}
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-[10px] font-semibold animate-pulse-soft">
            Últimas unidades
          </span>
        )}

        {/* Hover actions */}
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

        {/* Price */}
        <div className="mt-auto pt-3">
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

          {/* Stock */}
          <p className={`text-xs mt-1 font-medium ${product.stock > 5 ? "text-success" : product.stock > 0 ? "text-secondary" : "text-destructive"}`}>
            {product.stock > 5 ? "En stock" : product.stock > 0 ? `Solo ${product.stock} disponibles` : "Agotado"}
          </p>
        </div>

        {/* Actions */}
        <button
          onClick={() => addItem(product)}
          disabled={product.stock === 0}
          className="mt-3 w-full h-10 rounded-lg bg-gradient-secondary text-secondary-foreground text-sm font-semibold shadow-button hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Agregar al carrito
        </button>
      </div>
    </div>
  );
}
