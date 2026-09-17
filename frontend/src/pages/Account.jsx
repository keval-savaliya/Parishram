import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Download, Edit3, LogOut, MapPin, PackageOpen, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, downloadPdf, formatApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Reveal } from "../components/Reveal";

export const StatusBadge = ({ status }) => {
  const styles = {
    "Under Review": "border-amber-600/40 bg-amber-50 text-amber-700",
    "Estimate Ready": "border-brand-blue/40 bg-brand-wash text-brand-blue",
    Approved: "border-emerald-600/40 bg-emerald-50 text-emerald-700",
    Closed: "border-slate-400/40 bg-slate-100 text-slate-600",
    Pending: "border-amber-600/40 bg-amber-50 text-amber-700",
    Confirmed: "border-brand-blue/40 bg-brand-wash text-brand-blue",
    Dispatched: "border-brand-blue/40 bg-brand-wash text-brand-blue",
    Delivered: "border-emerald-600/40 bg-emerald-50 text-emerald-700",
    Cancelled: "border-red-600/40 bg-red-50 text-red-600",
  };
  return (
    <span className={`inline-block border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] ${styles[status] || styles["Under Review"]}`} data-testid={`status-badge-${status?.toLowerCase().replace(/\s+/g, "-")}`}>
      {status}
    </span>
  );
};

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const inputCls = "h-11 w-full border border-slate-300 bg-white px-3 font-mono text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-amber-600";
const emptyAddr = { label: "Works", name: "", phone: "", line1: "", city: "", state: "", pincode: "" };

export default function Account() {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(() => searchParams.get("tab") || "quotes");
  const [enquiries, setEnquiries] = useState(null);
  const [orders, setOrders] = useState(null);
  const [addresses, setAddresses] = useState(null);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addr, setAddr] = useState(emptyAddr);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const loadAddresses = useCallback(() => api.get("/addresses").then(({ data }) => {
    setAddresses(data);
    const editId = searchParams.get("edit");
    const address = data.find((item) => item.address_id === editId);
    if (address) {
      setEditingAddressId(address.address_id);
      setAddr({ ...emptyAddr, ...address });
      setShowAddrForm(true);
    }
  }).catch(() => setAddresses([])), [searchParams]);

  useEffect(() => {
    api.get("/enquiries/mine").then(({ data }) => setEnquiries(data)).catch(() => setEnquiries([]));
    api.get("/orders/mine").then(({ data }) => setOrders(data)).catch(() => setOrders([]));
    loadAddresses();
  }, [loadAddresses]);

  const saveAddress = async (e) => {
    e.preventDefault();
    try {
      const path = editingAddressId ? `/addresses/${editingAddressId}` : "/addresses";
      await api[editingAddressId ? "put" : "post"](path, addr);
      toast.success(editingAddressId ? "Address updated" : "Address saved");
      setAddr(emptyAddr);
      setEditingAddressId(null);
      setShowAddrForm(false);
      loadAddresses();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const removeAddress = async (id) => {
    await api.delete(`/addresses/${id}`).catch(() => {});
    loadAddresses();
  };

  const editAddress = (address) => {
    setEditingAddressId(address.address_id);
    setAddr({ ...emptyAddr, ...address });
    setShowAddrForm(true);
  };

  const setA = (k) => (e) => setAddr({ ...addr, [k]: e.target.value });

  const downloadDocument = async (path, fallbackName) => {
    try {
      await downloadPdf(path, fallbackName);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-32 lg:pt-40" data-testid="account-page">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="eyebrow">My Account</p>
              <h1 className="mt-3 font-display text-4xl font-black uppercase tracking-tight text-slate-900" data-testid="account-name">
                {user?.name || "Customer"}
              </h1>
              <p className="mt-2 font-mono text-xs uppercase tracking-[0.15em] text-slate-500">{user?.email}</p>
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  className="mt-4 inline-flex items-center gap-2 border border-amber-600/50 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-amber-700 transition-colors hover:bg-amber-600 hover:text-white"
                  data-testid="admin-panel-link"
                >
                  <ShieldCheck className="h-4 w-4" /> Admin Panel
                </Link>
              )}
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 border border-slate-300 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-600 transition-colors hover:border-red-500 hover:text-red-600"
              data-testid="logout-button"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </Reveal>

        <div className="mt-12 flex flex-wrap gap-2" data-testid="account-tabs">
          {[
            { k: "quotes", l: "Quote Enquiries" },
            { k: "orders", l: "Orders" },
            { k: "addresses", l: "Addresses" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`h-10 border px-5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors ${
                tab === t.k ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-slate-950"
              }`}
              data-testid={`account-tab-${t.k}`}
            >
              {t.l}
            </button>
          ))}
        </div>

        {tab === "quotes" && (
          <div className="mt-8">
            {enquiries === null ? (
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Loading…</p>
            ) : enquiries.length === 0 ? (
              <div className="border border-slate-200 bg-white p-14 text-center" data-testid="enquiries-empty">
                <PackageOpen className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-4 font-display text-lg font-bold uppercase text-slate-500">No enquiries yet</p>
                <Link to="/products" className="mt-5 inline-flex h-11 items-center bg-slate-950 px-6 font-mono text-[11px] uppercase tracking-[0.18em] text-white hover:bg-amber-600" data-testid="account-browse-products">
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="space-y-4" data-testid="enquiries-list">
                {enquiries.map((enq) => (
                  <div key={enq.enquiry_id} className="border border-slate-200 bg-white p-6" data-testid={`enquiry-${enq.ref}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="font-mono text-sm font-bold tracking-[0.12em] text-slate-900">{enq.ref}</span>
                        <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">
                          {new Date(enq.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={enq.status} />
                        <button
                          onClick={() => downloadDocument(`/enquiries/${enq.enquiry_id}/pdf`, `${enq.ref}.pdf`)}
                          className="inline-flex h-8 items-center gap-1.5 border border-slate-300 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-600 transition-colors hover:border-brand-blue hover:text-brand-blue"
                          data-testid={`download-quote-pdf-${enq.ref}`}
                          title="Download quote PDF"
                        >
                          <Download className="h-3.5 w-3.5" /> PDF
                        </button>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-4">
                      {enq.items?.map((item) => (
                        <li key={item.product_id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-slate-700">
                          <span className="font-medium">{item.title}</span>
                          <span className="font-mono text-xs text-slate-500">× {item.qty}{item.note ? ` · ${item.note}` : ""}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "orders" && (
          <div className="mt-8">
            {orders === null ? (
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Loading…</p>
            ) : orders.length === 0 ? (
              <div className="border border-slate-200 bg-white p-14 text-center" data-testid="orders-empty">
                <PackageOpen className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-4 font-display text-lg font-bold uppercase text-slate-500">No orders yet</p>
                <Link to="/products" className="mt-5 inline-flex h-11 items-center bg-slate-950 px-6 font-mono text-[11px] uppercase tracking-[0.18em] text-white hover:bg-amber-600" data-testid="account-shop-products">
                  Shop Products
                </Link>
              </div>
            ) : (
              <div className="space-y-4" data-testid="orders-list">
                {orders.map((ord) => (
                  <div key={ord.order_id} className="border border-slate-200 bg-white p-6" data-testid={`order-${ord.ref}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="font-mono text-sm font-bold tracking-[0.12em] text-slate-900">{ord.ref}</span>
                        <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">
                          {new Date(ord.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <StatusBadge status={ord.status} />
                    </div>
                    <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-4">
                      {ord.items?.map((item) => (
                        <li key={item.variant_id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-slate-700">
                          <span className="font-medium">{item.title} — {item.size}</span>
                          <span className="font-mono text-xs text-slate-500">× {item.qty} @ {inr(item.price)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">{ord.payment_method}</span>
                      <span className="font-display text-lg font-extrabold text-amber-700">{inr(ord.total_amount)}</span>
                    </div>
                    <button
                      onClick={() => downloadDocument(`/orders/${ord.order_id}/pdf`, `${ord.ref}.pdf`)}
                      className="mt-4 inline-flex h-9 items-center gap-1.5 border border-slate-300 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-600 transition-colors hover:border-brand-blue hover:text-brand-blue"
                      data-testid={`download-order-pdf-${ord.ref}`}
                      title="Download order PDF"
                    >
                      <Download className="h-3.5 w-3.5" /> Download Order PDF
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "addresses" && (
          <div className="mt-8">
            <button
              onClick={() => {
                setEditingAddressId(null);
                setAddr(emptyAddr);
                setShowAddrForm(!showAddrForm);
              }}
              className="flex h-10 items-center gap-2 bg-amber-600 px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white hover:bg-amber-500"
              data-testid="add-address-button"
            >
              <Plus className="h-4 w-4" /> Add Address
            </button>
            {showAddrForm && (
              <form onSubmit={saveAddress} className="mt-5 grid gap-3 border border-slate-200 bg-white p-6 sm:grid-cols-2" data-testid="address-form">
                <input value={addr.label} onChange={setA("label")} placeholder="Label (Works / Plant / Home)" className={inputCls} data-testid="address-label" />
                <input value={addr.name} onChange={setA("name")} placeholder="Contact name *" required className={inputCls} data-testid="address-name" />
                <input value={addr.phone} onChange={setA("phone")} placeholder="Phone *" required className={inputCls} data-testid="address-phone" />
                <input value={addr.line1} onChange={setA("line1")} placeholder="Address line *" required className={inputCls} data-testid="address-line1" />
                <input value={addr.city} onChange={setA("city")} placeholder="City *" required className={inputCls} data-testid="address-city" />
                <input value={addr.state} onChange={setA("state")} placeholder="State *" required className={inputCls} data-testid="address-state" />
                <input value={addr.pincode} onChange={setA("pincode")} placeholder="Pincode *" required className={inputCls} data-testid="address-pincode" />
                <button type="submit" className="h-11 bg-slate-950 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white hover:bg-amber-600" data-testid="address-save">
                  {editingAddressId ? "Save Changes" : "Save Address"}
                </button>
              </form>
            )}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="addresses-list">
              {(addresses || []).map((a) => (
                <div key={a.address_id} className="border border-slate-200 bg-white p-5" data-testid={`address-${a.address_id}`}>
                  <div className="flex items-start justify-between">
                    <MapPin className="h-4 w-4 text-amber-600" />
                    <div className="flex items-center gap-3">
                      <button onClick={() => editAddress(a)} className="text-slate-400 hover:text-brand-blue" data-testid={`address-edit-${a.address_id}`} aria-label="Edit address" title="Edit address">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button onClick={() => removeAddress(a.address_id)} className="text-slate-400 hover:text-red-500" data-testid={`address-delete-${a.address_id}`} aria-label="Delete address">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-700">{a.label}</p>
                  <p className="mt-1.5 text-sm font-semibold text-slate-900">{a.name}</p>
                  <p className="mt-1 font-mono text-xs leading-relaxed text-slate-600">
                    {a.line1}, {a.city}, {a.state} — {a.pincode}
                  </p>
                </div>
              ))}
              {addresses?.length === 0 && !showAddrForm && (
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500" data-testid="addresses-empty">No saved addresses</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
