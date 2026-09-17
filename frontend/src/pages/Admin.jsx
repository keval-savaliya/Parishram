import { useEffect, useState } from "react";
import { Download, Plus, Pencil, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { api, downloadPdf, formatApiError } from "../lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { StatusBadge } from "./Account";

const STATUSES = ["Under Review", "Estimate Ready", "Approved", "Closed"];
const ORDER_STATUSES = ["Pending", "Confirmed", "Dispatched", "Delivered", "Cancelled"];
const emptyForm = { title: "", category: "S.S. Nipple Pipe Fittings", grade: "", moq: "", unit: "Piece", image: "", description: "", specs: "", variants: "", featured: false };

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const inputCls = "h-10 w-full border border-slate-300 bg-white px-3 font-mono text-xs text-slate-900 outline-none focus:border-amber-600";

export default function Admin() {
  const [tab, setTab] = useState("enquiries");
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    api.get("/admin/stats").then(({ data }) => setStats(data)).catch(() => {});
    api.get("/products").then(({ data }) => setProducts(data)).catch(() => {});
    api.get("/admin/enquiries").then(({ data }) => setEnquiries(data)).catch(() => {});
    api.get("/admin/orders").then(({ data }) => setOrders(data)).catch(() => {});
  };

  const downloadDocument = async (path, fallbackName) => {
    try {
      await downloadPdf(path, fallbackName);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  useEffect(load, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p.product_id);
    setForm({
      ...p,
      specs: (p.specs || []).join("\n"),
      variants: (p.variants || []).map((v) => `${v.size}, ${v.price}, ${v.stock_quantity}`).join("\n"),
    });
    setDialogOpen(true);
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      specs: form.specs.split("\n").map((s) => s.trim()).filter(Boolean),
      variants: form.variants
        .split("\n")
        .map((l) => l.split(",").map((s) => s.trim()))
        .filter((p) => p[0])
        .map((p) => ({ size: p[0], price: parseFloat(p[1]) || 0, stock_quantity: parseInt(p[2]) || 0, min_order_quantity: 1, availability: "In Stock" })),
    };
    try {
      if (editing) await api.put(`/products/${editing}`, payload);
      else await api.post("/products", payload);
      toast.success(editing ? "Product updated" : "Product added");
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted");
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((f) => ({ ...f, image: `${process.env.REACT_APP_BACKEND_URL}${data.url}` }));
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const setStatus = async (id, status) => {
    try {
      await api.patch(`/admin/enquiries/${id}`, { status });
      const { data } = await api.get("/admin/enquiries");
      setEnquiries(data);
      toast.success("Status updated");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const setOrderStatus = async (id, status) => {
    try {
      await api.patch(`/admin/orders/${id}`, { status });
      const { data } = await api.get("/admin/orders");
      setOrders(data);
      toast.success("Order status updated");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-32 lg:pt-40" data-testid="admin-page">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="eyebrow">Admin Console</p>
        <h1 className="mt-3 font-display text-4xl font-black uppercase tracking-tight text-slate-900">Plant Office</h1>

        <div className="mt-10 grid grid-cols-2 gap-px border border-slate-200 bg-slate-200 lg:grid-cols-5" data-testid="admin-stats">
          {[
            { l: "Products", v: stats?.products },
            { l: "Enquiries", v: stats?.enquiries },
            { l: "Pending Review", v: stats?.pending },
            { l: "Orders", v: stats?.orders },
            { l: "Customers", v: stats?.customers },
          ].map((s) => (
            <div key={s.l} className="bg-white px-6 py-5">
              <p className="font-display text-3xl font-extrabold text-slate-900">{s.v ?? "—"}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-2" data-testid="admin-tabs">
          {["enquiries", "orders", "products"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`h-10 border px-5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors ${
                tab === t ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-slate-950"
              }`}
              data-testid={`admin-tab-${t}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "products" && (
          <div className="mt-6" data-testid="admin-products-panel">
            <button onClick={openNew} className="flex h-10 items-center gap-2 bg-amber-600 px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white hover:bg-amber-500" data-testid="admin-add-product">
              <Plus className="h-4 w-4" /> Add Product
            </button>
            <div className="mt-5 overflow-x-auto border border-slate-200 bg-white">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    <th className="px-5 py-3.5">Product</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Grade</th>
                    <th className="px-5 py-3.5">Variants</th>
                    <th className="px-5 py-3.5">Featured</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.product_id} data-testid={`admin-product-${p.product_id}`}>
                      <td className="px-5 py-3 font-medium text-slate-900">{p.title}</td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-600">{p.category}</td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-600">{p.grade}</td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-600">{p.variants?.length || 0}</td>
                      <td className="px-5 py-3 font-mono text-xs">{p.featured ? "Yes" : "—"}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(p)} className="grid h-8 w-8 place-items-center border border-slate-300 text-slate-600 hover:border-slate-950" data-testid={`admin-edit-${p.product_id}`} aria-label="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => deleteProduct(p.product_id)} className="grid h-8 w-8 place-items-center border border-slate-300 text-slate-600 hover:border-red-500 hover:text-red-600" data-testid={`admin-delete-${p.product_id}`} aria-label="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "enquiries" && (
          <div className="mt-6 space-y-4" data-testid="admin-enquiries-panel">
            {enquiries.length === 0 && (
              <div className="border border-slate-200 bg-white p-12 text-center font-mono text-xs uppercase tracking-[0.2em] text-slate-500" data-testid="admin-no-enquiries">
                No enquiries yet
              </div>
            )}
            {enquiries.map((enq) => (
              <div key={enq.enquiry_id} className="border border-slate-200 bg-white p-6" data-testid={`admin-enquiry-${enq.ref}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="font-mono text-sm font-bold tracking-[0.12em] text-slate-900">{enq.ref}</span>
                    <p className="mt-1 text-sm text-slate-700">
                      {enq.name} {enq.company ? `· ${enq.company}` : ""} · <span className="font-mono text-xs">{enq.email}</span> {enq.phone ? `· ${enq.phone}` : ""}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">
                      {new Date(enq.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={enq.status} />
                    <button
                      onClick={() => downloadDocument(`/admin/enquiries/${enq.enquiry_id}/pdf`, `INTERNAL-${enq.ref}.pdf`)}
                      className="inline-flex h-9 items-center gap-1.5 border border-slate-300 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-600 transition-colors hover:border-brand-blue hover:text-brand-blue"
                      data-testid={`admin-download-quote-pdf-${enq.ref}`}
                      title="Download internal quote PDF"
                    >
                      <Download className="h-3.5 w-3.5" /> PDF
                    </button>
                    <select
                      value={enq.status}
                      onChange={(e) => setStatus(enq.enquiry_id, e.target.value)}
                      className="h-9 border border-slate-300 bg-white px-2 font-mono text-[11px] uppercase tracking-wide outline-none focus:border-amber-600"
                      data-testid={`admin-status-${enq.ref}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-4">
                  {enq.items?.map((item) => (
                    <li key={item.product_id} className="flex flex-wrap justify-between gap-2 text-sm text-slate-700">
                      <span>{item.title}</span>
                      <span className="font-mono text-xs text-slate-500">× {item.qty}{item.note ? ` · ${item.note}` : ""}</span>
                    </li>
                  ))}
                </ul>
                {enq.message && <p className="mt-3 border-l-2 border-amber-600 pl-3 text-sm italic text-slate-600">{enq.message}</p>}
              </div>
            ))}
          </div>
        )}

        {tab === "orders" && (
          <div className="mt-6 space-y-4" data-testid="admin-orders-panel">
            {orders.length === 0 && (
              <div className="border border-slate-200 bg-white p-12 text-center font-mono text-xs uppercase tracking-[0.2em] text-slate-500" data-testid="admin-no-orders">
                No orders yet
              </div>
            )}
            {orders.map((ord) => (
              <div key={ord.order_id} className="border border-slate-200 bg-white p-6" data-testid={`admin-order-${ord.ref}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="font-mono text-sm font-bold tracking-[0.12em] text-slate-900">{ord.ref}</span>
                    <p className="mt-1 text-sm text-slate-700">
                      {ord.customer_name} · <span className="font-mono text-xs">{ord.customer_email}</span>
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">
                      {new Date(ord.created_at).toLocaleString("en-IN")} · {ord.address?.city}, {ord.address?.state} — {ord.address?.pincode}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={ord.status} />
                    <select
                      value={ord.status}
                      onChange={(e) => setOrderStatus(ord.order_id, e.target.value)}
                      className="h-9 border border-slate-300 bg-white px-2 font-mono text-[11px] uppercase tracking-wide outline-none focus:border-amber-600"
                      data-testid={`admin-order-status-${ord.ref}`}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-4">
                  {ord.items?.map((item) => (
                    <li key={item.variant_id} className="flex flex-wrap justify-between gap-2 text-sm text-slate-700">
                      <span>{item.title} — {item.size}</span>
                      <span className="font-mono text-xs text-slate-500">× {item.qty} @ {inr(item.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">{ord.payment_method}{ord.note ? ` · ${ord.note}` : ""}</span>
                  <span className="font-display text-lg font-extrabold text-amber-700" data-testid={`admin-order-total-${ord.ref}`}>{inr(ord.total_amount)}</span>
                </div>
                <button
                  onClick={() => downloadDocument(`/admin/orders/${ord.order_id}/pdf`, `INTERNAL-${ord.ref}.pdf`)}
                  className="mt-4 inline-flex h-9 items-center gap-1.5 border border-slate-300 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-600 transition-colors hover:border-brand-blue hover:text-brand-blue"
                  data-testid={`admin-download-order-pdf-${ord.ref}`}
                  title="Download internal order PDF"
                >
                  <Download className="h-3.5 w-3.5" /> Download Internal PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" data-testid="product-dialog">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-tight">{editing ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveProduct} className="space-y-3">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title *" required className={inputCls} data-testid="product-form-title" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} data-testid="product-form-category">
              <option>S.S. Nipple Pipe Fittings</option>
              <option>Auto Parts</option>
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="Grade (e.g. SS 304)" className={inputCls} data-testid="product-form-grade" />
              <input value={form.moq} onChange={(e) => setForm({ ...form, moq: e.target.value })} placeholder="MOQ (e.g. 100 pcs)" className={inputCls} data-testid="product-form-moq" />
            </div>
            <div>
              <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="Image URL (or upload below)" className={inputCls} data-testid="product-form-image" />
              <div className="mt-2 flex items-center gap-3">
                <label className={`flex h-10 items-center gap-2 border border-slate-300 px-4 font-mono text-[11px] uppercase tracking-[0.15em] text-slate-700 transition-colors ${uploading ? "cursor-wait opacity-60" : "cursor-pointer hover:border-slate-950"}`} data-testid="product-form-upload-label">
                  <Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading…" : "Upload Photo"}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFile} disabled={uploading} data-testid="product-form-upload" />
                </label>
                {form.image && (
                  <img src={form.image} alt="Product preview" className="h-10 w-10 border border-slate-200 object-cover" data-testid="product-form-preview" />
                )}
              </div>
            </div>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} className="w-full border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:border-amber-600" data-testid="product-form-description" />
            <textarea value={form.specs} onChange={(e) => setForm({ ...form, specs: e.target.value })} placeholder="Specs — one per line" rows={3} className="w-full border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:border-amber-600" data-testid="product-form-specs" />
            <textarea value={form.variants} onChange={(e) => setForm({ ...form, variants: e.target.value })} placeholder={'Variants — one per line: size, price, stock\ne.g. 1/2", 65, 500'} rows={3} className="w-full border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:border-amber-600" data-testid="product-form-variants" />
            <label className="flex items-center gap-2 font-mono text-xs text-slate-700">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} data-testid="product-form-featured" />
              Featured on homepage
            </label>
            <button type="submit" className="h-11 w-full bg-slate-950 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-amber-600" data-testid="product-form-save">
              {editing ? "Save Changes" : "Add Product"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
