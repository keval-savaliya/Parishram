import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "../lib/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Reveal } from "../components/Reveal";

const inputCls =
  "h-12 w-full border border-slate-300 bg-white px-4 font-mono text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-amber-600";

export default function QuoteCart() {
  const { items, updateQty, updateNote, remove, clear } = useCart();
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    company: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("Name and email are required");
      return;
    }
    setSending(true);
    try {
      const { data } = await api.post("/enquiries", {
        ...form,
        items: items.map((i) => ({ product_id: i.product_id, title: i.title, qty: i.qty, note: i.note })),
      });
      setSubmitted(data.ref);
      clear();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSending(false);
    }
  };

  if (submitted)
    return (
      <div className="grid min-h-screen place-items-center bg-[#F8FAFC] px-4 pt-24" data-testid="quote-success">
        <Reveal className="w-full max-w-lg">
          <div className="border border-slate-200 bg-white p-10 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-amber-600" />
            <h1 className="mt-6 font-display text-3xl font-black uppercase tracking-tight text-slate-900">Enquiry Received</h1>
            <p className="mt-3 text-sm text-slate-600">
              Reference number
            </p>
            <p className="mt-1 font-mono text-xl font-bold tracking-[0.15em] text-amber-700" data-testid="quote-ref">{submitted}</p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Our sales engineers will email a formal quotation with pricing, lead time and freight
              within 24 working hours.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link to="/products" className="flex h-11 items-center justify-center border border-slate-300 px-6 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-700 hover:border-slate-950" data-testid="quote-success-browse">
                Continue Browsing
              </Link>
              <Link to="/account" className="flex h-11 items-center justify-center bg-slate-950 px-6 font-mono text-[11px] uppercase tracking-[0.18em] text-white hover:bg-amber-600" data-testid="quote-success-account">
                Track in Account
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-32 lg:pt-40" data-testid="quote-cart-page">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <Link to="/products" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500 hover:text-amber-700" data-testid="quote-back-link">
            <ArrowLeft className="h-3.5 w-3.5" /> Continue browsing
          </Link>
          <h1 className="mt-4 font-display text-4xl font-black uppercase tracking-tight text-slate-900 sm:text-5xl">
            Quote <span className="text-amber-600">Enquiry</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-slate-600">
            Review quantities, add size or thread notes per item, and submit. No payment is taken online.
          </p>
        </Reveal>

        {items.length === 0 ? (
          <Reveal delay={0.1}>
            <div className="mt-12 border border-slate-200 bg-white p-16 text-center" data-testid="quote-empty-state">
              <p className="font-display text-xl font-bold uppercase text-slate-500">Your quote cart is empty</p>
              <Link
                to="/products"
                className="mt-6 inline-flex h-11 items-center gap-2 bg-slate-950 px-6 font-mono text-[11px] uppercase tracking-[0.18em] text-white hover:bg-amber-600"
                data-testid="quote-empty-browse"
              >
                Browse Products <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Reveal>
        ) : (
          <form onSubmit={submit} className="mt-12 grid gap-10 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3" data-testid="quote-items-list">
              {items.map((item, i) => (
                <Reveal key={item.product_id} delay={i * 0.05}>
                  <div className="border border-slate-200 bg-white p-5">
                    <div className="flex gap-4">
                      <img src={item.image} alt={item.title} className="h-20 w-20 shrink-0 object-cover" loading="lazy" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-display text-base font-bold uppercase tracking-tight text-slate-900">{item.title}</p>
                            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">{item.grade}</p>
                          </div>
                          <button type="button" onClick={() => remove(item.product_id)} className="text-slate-400 hover:text-red-500" data-testid={`quote-remove-${item.product_id}`} aria-label="Remove">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-4">
                          <div className="flex items-center border border-slate-300">
                            <button type="button" className="grid h-9 w-9 place-items-center text-slate-500 hover:text-amber-700" onClick={() => updateQty(item.product_id, item.qty - 10)} data-testid={`quote-qty-minus-${item.product_id}`}>
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <input
                              value={item.qty}
                              onChange={(e) => updateQty(item.product_id, parseInt(e.target.value) || 1)}
                              className="h-9 w-16 border-x border-slate-300 text-center font-mono text-xs outline-none"
                              data-testid={`quote-qty-input-${item.product_id}`}
                            />
                            <button type="button" className="grid h-9 w-9 place-items-center text-slate-500 hover:text-amber-700" onClick={() => updateQty(item.product_id, item.qty + 10)} data-testid={`quote-qty-plus-${item.product_id}`}>
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">pcs</span>
                        </div>
                      </div>
                    </div>
                    <input
                      value={item.note}
                      onChange={(e) => updateNote(item.product_id, e.target.value)}
                      placeholder='Spec note (optional) — e.g. 1/2" BSP × 100mm, SS 316L'
                      className="mt-4 h-10 w-full border border-slate-200 bg-slate-50 px-3 font-mono text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-amber-600"
                      data-testid={`quote-note-${item.product_id}`}
                    />
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.1} className="lg:col-span-2">
              <div className="sticky top-32 border border-slate-200 bg-white p-7">
                <h2 className="font-display text-xl font-extrabold uppercase tracking-tight text-slate-900">Your Details</h2>
                <div className="mt-6 space-y-4">
                  <input value={form.name} onChange={set("name")} placeholder="Full name *" className={inputCls} data-testid="quote-name-input" />
                  <input value={form.email} onChange={set("email")} type="email" placeholder="Email *" className={inputCls} data-testid="quote-email-input" />
                  <input value={form.phone} onChange={set("phone")} placeholder="Phone / WhatsApp" className={inputCls} data-testid="quote-phone-input" />
                  <input value={form.company} onChange={set("company")} placeholder="Company name" className={inputCls} data-testid="quote-company-input" />
                  <textarea
                    value={form.message}
                    onChange={set("message")}
                    rows={4}
                    placeholder="Delivery location, timeline, GST details…"
                    className="w-full border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-amber-600"
                    data-testid="quote-message-input"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="mt-6 flex h-13 h-12 w-full items-center justify-center gap-2 bg-amber-600 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all hover:bg-amber-500 active:scale-[0.98] disabled:opacity-50"
                  data-testid="submit-enquiry-btn"
                >
                  {sending ? "Submitting…" : "Submit Enquiry"} <ArrowRight className="h-4 w-4" />
                </button>
                <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">
                  Formal quotation within 24 working hours
                </p>
              </div>
            </Reveal>
          </form>
        )}
      </div>
    </div>
  );
}
