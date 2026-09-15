import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { useCart } from "../context/CartContext";

export const CartDrawer = () => {
  const { items, drawerOpen, setDrawerOpen, updateQty, remove, count } = useCart();

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col border-l border-white/10 bg-[#0B0F19] p-0 text-slate-200 sm:max-w-md"
        data-testid="quote-cart-drawer"
      >
        <SheetHeader className="border-b border-white/10 px-6 py-5">
          <SheetTitle className="flex items-center justify-between font-display text-lg font-bold uppercase tracking-tight text-white">
            Quote Cart
            <span className="font-mono text-[10px] tracking-[0.2em] text-amber-500">{count} ITEMS</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="grid h-full place-items-center text-center" data-testid="cart-empty-state">
              <div>
                <p className="font-display text-lg font-bold uppercase text-slate-400">Cart is empty</p>
                <p className="mt-2 text-sm text-slate-500">Add products to request a B2B quotation.</p>
                <Link
                  to="/products"
                  onClick={() => setDrawerOpen(false)}
                  className="mt-5 inline-flex h-10 items-center gap-2 border border-amber-600/60 px-4 font-mono text-[11px] uppercase tracking-[0.18em] text-amber-500 transition-colors hover:bg-amber-600 hover:text-white"
                  data-testid="cart-browse-products"
                >
                  Browse Products <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.product_id} className="flex gap-4 border border-white/10 bg-white/5 p-3" data-testid={`cart-item-${item.product_id}`}>
                  <img src={item.image} alt={item.title} className="h-16 w-16 shrink-0 object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-bold uppercase tracking-tight text-white">{item.title}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">{item.grade}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center border border-white/15">
                        <button
                          className="grid h-7 w-7 place-items-center text-slate-400 hover:text-amber-500"
                          onClick={() => updateQty(item.product_id, item.qty - 1)}
                          data-testid={`cart-qty-minus-${item.product_id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center font-mono text-xs">{item.qty}</span>
                        <button
                          className="grid h-7 w-7 place-items-center text-slate-400 hover:text-amber-500"
                          onClick={() => updateQty(item.product_id, item.qty + 1)}
                          data-testid={`cart-qty-plus-${item.product_id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        className="text-slate-500 transition-colors hover:text-red-400"
                        onClick={() => remove(item.product_id)}
                        data-testid={`cart-remove-${item.product_id}`}
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-white/10 p-6">
            <Link
              to="/quote"
              onClick={() => setDrawerOpen(false)}
              className="flex h-12 w-full items-center justify-center gap-2 bg-amber-600 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all hover:bg-amber-500 active:scale-[0.98]"
              data-testid="cart-submit-enquiry-link"
            >
              Submit Quote Enquiry <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">
              Pricing shared within 24 hours
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
