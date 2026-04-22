import React, { createContext, useCallback, useContext, useState } from "react";
import { CartItem, Product } from "@/types/store";
import { toast } from "sonner";
import { findProductById } from "@/data/store-data";

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("netpower-cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const persist = useCallback((newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem("netpower-cart", JSON.stringify(newItems));
  }, []);

  const addItem = useCallback(
    (product: Product, quantity = 1) => {
      // Para productos de Supabase, findProductById (data local) no encontrará match → usamos el product entrante
      const liveProduct = findProductById(product.id) || product;

      if (!liveProduct.active) {
        toast.error("Este producto ya no está disponible en la tienda");
        return;
      }

      // stock null/undefined = no asignado → no se puede agregar al carrito (debe cotizar por WhatsApp)
      if (liveProduct.stock === null || liveProduct.stock === undefined) {
        toast.error("Este producto requiere cotización. Contáctanos por WhatsApp");
        return;
      }

      if (liveProduct.stock <= 0) {
        toast.error("Producto agotado. Pregunta disponibilidad por WhatsApp");
        return;
      }

      const safeQty = Math.max(1, Math.floor(quantity));
      const existing = items.find((item) => item.product.id === product.id);
      const currentQty = existing?.quantity || 0;
      const nextQty = Math.min(liveProduct.stock, currentQty + safeQty);

      if (nextQty === currentQty) {
        toast.error("No hay más unidades disponibles para agregar");
        return;
      }

      const nextItems = existing
        ? items.map((item) => (item.product.id === product.id ? { ...item, product: liveProduct, quantity: nextQty } : item))
        : [...items, { product: liveProduct, quantity: nextQty }];

      persist(nextItems);

      if (nextQty < currentQty + safeQty) {
        toast.warning(`Se ajustó al stock disponible (${liveProduct.stock} unidades)`);
      } else {
        toast.success(`${liveProduct.name} agregado al carrito`);
      }
    },
    [items, persist]
  );

  const removeItem = useCallback(
    (productId: string) => {
      const next = items.filter((item) => item.product.id !== productId);
      persist(next);
    },
    [items, persist]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      const existing = items.find((item) => item.product.id === productId);
      if (!existing || quantity < 1) return;

      const liveProduct = findProductById(productId);
      const maxStock = liveProduct?.stock ?? existing.product.stock;

      if (maxStock === null || maxStock === undefined) {
        toast.error("Producto sin stock asignado");
        return;
      }

      if (maxStock <= 0) {
        toast.error("Producto agotado");
        return;
      }

      const normalizedQty = Math.min(Math.max(1, Math.floor(quantity)), maxStock);
      const next = items.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              product: liveProduct || existing.product,
              quantity: normalizedQty,
            }
          : item
      );

      persist(next);

      if (normalizedQty !== quantity) {
        toast.warning(`Cantidad ajustada al stock disponible (${maxStock})`);
      }
    },
    [items, persist]
  );

  const clearCart = useCallback(() => persist([]), [persist]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.product.salePrice || item.product.price) * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
