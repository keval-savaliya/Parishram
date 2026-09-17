import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Edit3, Lock, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "../lib/api";
import { useShopCart } from "../context/ShopCartContext";
import { useAuth } from "../context/AuthContext";
import { Reveal } from "../components/Reveal";

const inputCls =
  "h-11 w-full border border-slate-300 bg-white px-3 font-mono text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-amber-600";
const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function Cart() {
  const { items, updateQty, remove, clear, total } = useShopCart();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [selected, setSelected] = useState("new");
  const [addr, setAddr] = useState({ label: "Works", name: "", phone: "", line1: "", city: "", state: "", pincode: "" });
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(null);

  useEffect(() => {
    if (user) {
      api
        .get("/addresses")
        .then(({ data }) => {
          setAddresses(data);
          if (data.length > 0) setSelected(data[0].address_id);
        })
        .catch(() => {});
      if (user.name) setAddr((a) => ({ ...a, name: a.name || user.name }));
    }
  }, [user]);

  const set = (k) => (e) => setAddr({ ...addr, [k]: e.target.value });

  const placeOrder = async () => {
    const address = selected === "new" ? addr : addresses.find((a) => a.address_id === selected);
    if (!address || !address.name || !address.phone || !address.line1 || !address.city || !address.state || !address.pincode) {
      toast.error("Please complete all delivery address fields");
      return;
    }
    setPlacing(true);
    try {
      const { data } = await api.post("/orders", {
        items: items.map((i) => ({ variant_id: i.variant_id, product_id: i.product_id, title: i.title, size: i.size, qty: i.qty })),
        address,
        note,
      });
      if (selected === "new") api.post("/addresses", addr).catch(() => {});
      setPlaced(data);
      clear();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setPlacing(false);
    }
  };

  if (placed)
    return (
      <div className="grid min-h-screen place-items-center bg-[#F8FAFC] px-4 pt-24" data-testid="order-success">
        <Reveal className="w-full max-w-lg">
          <div className="border border-slate-200 bg-white p-10 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-amber-600" />
            <h1 className="mt-6 font-display text-3xl font-black uppercase tracking-tight text-slate-900">Order Placed</h1>
            <p className="mt-3 text-sm text-slate-600">Order reference</p>
            <p className="mt-1 font-mono text-xl font-bold tracking-[0.15em] text-amber-700" data-testid="order-ref">{placed.ref}</p>
            <p className="mt-4 font-mono text-sm text-slate-900" data-testid="order-total">Total: {inr(placed.total_amount)}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Payment by bank transfer or UPI on invoice — our team will confirm stock, freight and
              share the proforma invoice shortly.
            </p>
            <Link to="/account" className="mt-8 inline-flex h-11 items-center bg-slate-950 px-6 font-mono text-[11px] uppercase tracking-[0.18em] text-white hover:bg-amber-600" data-testid="order-success-account">
              Track in Account
            </Link>
          </div>
        </Reveal>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-32 lg:pt-40" data-testid="cart-page">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="eyebrow">Ecommerce Checkout</p>
          <h1 className="mt-3 font-display text-4xl font-black uppercase tracking-tight text-slate-900 sm:text-5xl">
            Shopping <span className="text-amber-600">Cart</span>
          </h1>
        </Reveal>

        {items.length === 0 ? (
          <Reveal delay={0.1}>
            <div className="mt-12 border border-slate-200 bg-white p-16 text-center" data-testid="cart-empty">
              <ShoppingBag className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 font-display text-xl font-bold uppercase text-slate-500">Your cart is empty</p>
              <Link to="/products" className="mt-6 inline-flex h-11 items-center bg-slate-950 px-6 font-mono text-[11px] uppercase tracking-[0.18em] text-white hover:bg-amber-600" data-testid="cart-browse">
                Browse Products
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="mt-12 grid gap-10 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3" data-testid="cart-items">
              {items.map((item, i) => (
                <Reveal key={item.variant_id} delay={i * 0.05}>
                  <div className="flex gap-4 border border-slate-200 bg-white p-5" data-testid={`cart-line-${item.variant_id}`}>
                    <img src={item.image} alt={item.title} className="h-20 w-20 shrink-0 object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-base font-bold uppercase tracking-tight text-slate-900">{item.title}</p>
                          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">
                            Size {item.size} · {inr(item.price)}/pc
                          </p>
                        </div>
                        <button onClick={() => remove(item.variant_id)} className="text-slate-400 hover:text-red-500" data-testid={`cart-line-remove-${item.variant_id}`} aria-label="Remove">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center border border-slate-300">
                          <button className="grid h-9 w-9 place-items-center text-slate-500 hover:text-amber-700" onClick={() => updateQty(item.variant_id, item.qty - 10)} data-testid={`cart-line-minus-${item.variant_id}`}>
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <input
                            value={item.qty}
                            onChange={(e) => updateQty(item.variant_id, parseInt(e.target.value) || 1)}
                            className="h-9 w-16 border-x border-slate-300 text-center font-mono text-xs outline-none"
                            data-testid={`cart-line-qty-${item.variant_id}`}
                          />
                          <button className="grid h-9 w-9 place-items-center text-slate-500 hover:text-amber-700" onClick={() => updateQty(item.variant_id, item.qty + 10)} data-testid={`cart-line-plus-${item.variant_id}`}>
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="font-mono text-sm font-semibold text-slate-900">{inr(item.price * item.qty)}</span>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.1} className="lg:col-span-2">
              <div className="sticky top-32 space-y-6">
                <div className="border border-slate-200 bg-white p-7" data-testid="cart-summary">
                  <h2 className="font-display text-xl font-extrabold uppercase tracking-tight text-slate-900">Order Summary</h2>
                  <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-5 font-mono text-xs text-slate-600">
                    <div className="flex justify-between"><span>Subtotal</span><span data-testid="cart-subtotal">{inr(total)}</span></div>
                    <div className="flex justify-between"><span>GST</span><span>18% extra, as applicable</span></div>
                    <div className="flex justify-between"><span>Freight</span><span>Confirmed on invoice</span></div>
                  </div>
                  <div className="mt-4 flex justify-between border-t border-slate-200 pt-4">
                    <span className="font-display text-lg font-bold uppercase text-slate-900">Total</span>
                    <span className="font-display text-lg font-extrabold text-amber-700" data-testid="cart-total">{inr(total)}</span>
                  </div>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">
                    Payment: bank transfer / UPI on proforma invoice
                  </p>
                </div>

                {!user ? (
                  <div className="border border-slate-200 bg-white p-7 text-center" data-testid="cart-login-prompt">
                    <Lock className="mx-auto h-6 w-6 text-amber-600" />
                    <p className="mt-3 font-display text-lg font-bold uppercase text-slate-900">Login to place order</p>
                    <p className="mt-2 text-sm text-slate-600">Your cart is saved — sign in to add a delivery address and checkout.</p>
                    <Link to="/login" className="mt-5 inline-flex h-11 items-center bg-amber-600 px-8 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white hover:bg-amber-500" data-testid="cart-login-button">
                      Login / Register
                    </Link>
                  </div>
                ) : (
                  <div className="border border-slate-200 bg-white p-7" data-testid="checkout-panel">
                    <h2 className="font-display text-xl font-extrabold uppercase tracking-tight text-slate-900">Delivery Address</h2>
                    <div className="mt-5 space-y-3">
                      {addresses.map((a) => (
                        <label key={a.address_id} className={`flex cursor-pointer gap-3 border p-4 transition-colors ${selected === a.address_id ? "border-amber-600 bg-amber-50/50" : "border-slate-200"}`} data-testid={`address-option-${a.address_id}`}>
                          <input type="radio" name="addr" checked={selected === a.address_id} onChange={() => setSelected(a.address_id)} className="mt-1" />
                          <span className="min-w-0 flex-1 text-sm text-slate-700">
                            <span className="font-semibold">{a.name}</span> · {a.label}
                            <span className="block font-mono text-xs text-slate-500">{a.line1}, {a.city}, {a.state} — {a.pincode}</span>
                          </span>
                          <Link
                            to={`/account?tab=addresses&edit=${a.address_id}`}
                            onClick={(event) => event.stopPropagation()}
                            className="grid h-8 w-8 shrink-0 place-items-center text-slate-400 transition-colors hover:text-brand-blue"
                            data-testid={`cart-edit-address-${a.address_id}`}
                            aria-label={`Edit ${a.label} address`}
                            title="Edit address"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Link>
                        </label>
                      ))}
                      <label className={`flex cursor-pointer gap-3 border p-4 transition-colors ${selected === "new" ? "border-amber-600 bg-amber-50/50" : "border-slate-200"}`} data-testid="address-option-new">
                        <input type="radio" name="addr" checked={selected === "new"} onChange={() => setSelected("new")} className="mt-1" />
                        <span className="text-sm font-medium text-slate-700">New address</span>
                      </label>
                      {selected === "new" && (
                        <div className="grid gap-3 border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2" data-testid="new-address-form">
                          <input value={addr.name} onChange={set("name")} placeholder="Contact name *" required className={inputCls} data-testid="addr-name" />
                          <input value={addr.phone} onChange={set("phone")} placeholder="Phone *" required className={inputCls} data-testid="addr-phone" />
                          <input value={addr.line1} onChange={set("line1")} placeholder="Address line *" required className={`${inputCls} sm:col-span-2`} data-testid="addr-line1" />
                          <input value={addr.city} onChange={set("city")} placeholder="City *" required className={inputCls} data-testid="addr-city" />
                          <input value={addr.state} onChange={set("state")} placeholder="State *" required className={inputCls} data-testid="addr-state" />
                          <input value={addr.pincode} onChange={set("pincode")} placeholder="Pincode *" required className={inputCls} data-testid="addr-pincode" />
                        </div>
                      )}
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        placeholder="Order note — delivery timeline, transport preference…"
                        className="w-full border border-slate-300 bg-white px-3 py-2.5 font-mono text-xs outline-none placeholder:text-slate-400 focus:border-amber-600"
                        data-testid="order-note"
                      />
                      <button
                        onClick={placeOrder}
                        disabled={placing}
                        className="flex h-12 w-full items-center justify-center gap-2 bg-amber-600 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all hover:bg-amber-500 active:scale-[0.98] disabled:opacity-50"
                        data-testid="place-order-button"
                      >
                        {placing ? "Placing…" : `Place Order — ${inr(total)}`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        )}
      </div>
    </div>
  );
}
