import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";

const ShopCartContext = createContext(null);
const KEY = "pe_shop_cart";

export const ShopCartProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  });
  const synced = useRef(false);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  // Mirror the shop cart to the server-side Cart collection once per login
  useEffect(() => {
    if (user && !synced.current) {
      synced.current = true;
      api.post("/cart/sync", { items }).catch(() => {});
    }
    if (!user) synced.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const add = (product, variant, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variant_id === variant.variant_id);
      if (existing) {
        return prev.map((i) => (i.variant_id === variant.variant_id ? { ...i, qty: i.qty + qty } : i));
      }
      return [
        ...prev,
        {
          variant_id: variant.variant_id,
          product_id: product.product_id,
          title: product.title,
          image: product.image,
          size: variant.size,
          price: variant.price,
          qty,
        },
      ];
    });
    toast.success("Added to cart", { description: `${product.title} — ${variant.size}` });
  };

  const remove = (variant_id) => setItems((prev) => prev.filter((i) => i.variant_id !== variant_id));

  const updateQty = (variant_id, qty) =>
    setItems((prev) => prev.map((i) => (i.variant_id === variant_id ? { ...i, qty: Math.max(1, qty) } : i)));

  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <ShopCartContext.Provider value={{ items, add, remove, updateQty, clear, count, total }}>
      {children}
    </ShopCartContext.Provider>
  );
};

export const useShopCart = () => useContext(ShopCartContext);
