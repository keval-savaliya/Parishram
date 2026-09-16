import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

const CartContext = createContext(null);
const STORAGE_KEY = "pe_quote_cart";

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = (product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.product_id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.product_id ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.product_id,
          title: product.title,
          image: product.image,
          category: product.category,
          grade: product.grade,
          qty,
          note: "",
        },
      ];
    });
    toast.custom((id) => (
      <button
        type="button"
        onClick={() => toast.dismiss(id)}
        className="flex w-[min(356px,calc(100vw-32px))] cursor-pointer items-start gap-3 border-l-4 border-amber-500 bg-slate-950 px-4 py-3 text-left text-white shadow-xl"
        aria-label="Dismiss cart notification"
      >
        <span>
          <span className="block font-mono text-xs font-semibold uppercase tracking-[0.15em]">Added to quote cart</span>
          <span className="mt-1 block text-xs text-slate-300">{product.title}</span>
        </span>
      </button>
    ));
  };

  const remove = (product_id) =>
    setItems((prev) => prev.filter((i) => i.product_id !== product_id));

  const updateQty = (product_id, qty) =>
    setItems((prev) =>
      prev.map((i) => (i.product_id === product_id ? { ...i, qty: Math.max(1, qty) } : i))
    );

  const updateNote = (product_id, note) =>
    setItems((prev) => prev.map((i) => (i.product_id === product_id ? { ...i, note } : i)));

  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, add, remove, updateQty, updateNote, clear, count, drawerOpen, setDrawerOpen }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
