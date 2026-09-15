import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, PackageOpen, ShieldCheck } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Reveal } from "../components/Reveal";

export const StatusBadge = ({ status }) => {
  const styles = {
    "Under Review": "border-amber-600/40 bg-amber-50 text-amber-700",
    "Estimate Ready": "border-blue-600/40 bg-blue-50 text-blue-700",
    Approved: "border-emerald-600/40 bg-emerald-50 text-emerald-700",
    Closed: "border-slate-400/40 bg-slate-100 text-slate-600",
  };
  return (
    <span className={`inline-block border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] ${styles[status] || styles["Under Review"]}`} data-testid={`status-badge-${status?.toLowerCase().replace(/\s+/g, "-")}`}>
      {status}
    </span>
  );
};

export default function Account() {
  const { user, logout } = useAuth();
  const [enquiries, setEnquiries] = useState(null);

  useEffect(() => {
    api.get("/enquiries/mine").then(({ data }) => setEnquiries(data)).catch(() => setEnquiries([]));
  }, []);

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

        <Reveal delay={0.1}>
          <h2 className="mt-14 font-display text-2xl font-extrabold uppercase tracking-tight text-slate-900">Quote Enquiry History</h2>
        </Reveal>

        {enquiries === null ? (
          <p className="mt-8 font-mono text-xs uppercase tracking-[0.2em] text-slate-500">Loading…</p>
        ) : enquiries.length === 0 ? (
          <Reveal delay={0.12}>
            <div className="mt-6 border border-slate-200 bg-white p-14 text-center" data-testid="enquiries-empty">
              <PackageOpen className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 font-display text-lg font-bold uppercase text-slate-500">No enquiries yet</p>
              <Link to="/products" className="mt-5 inline-flex h-11 items-center bg-slate-950 px-6 font-mono text-[11px] uppercase tracking-[0.18em] text-white hover:bg-amber-600" data-testid="account-browse-products">
                Browse Products
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="mt-6 space-y-4" data-testid="enquiries-list">
            {enquiries.map((enq, i) => (
              <Reveal key={enq.enquiry_id} delay={i * 0.05}>
                <div className="border border-slate-200 bg-white p-6" data-testid={`enquiry-${enq.ref}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="font-mono text-sm font-bold tracking-[0.12em] text-slate-900">{enq.ref}</span>
                      <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">
                        {new Date(enq.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <StatusBadge status={enq.status} />
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
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
