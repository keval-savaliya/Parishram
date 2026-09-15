import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, ClipboardList, User, Phone } from "lucide-react";
import { LogoMark, LogoType } from "./Logo";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const LINKS = [
  { to: "/", label: "Home", testid: "nav-link-home" },
  { to: "/about", label: "About Us", testid: "nav-link-about" },
  { to: "/products", label: "Products", testid: "nav-link-products" },
  { to: "/industries", label: "Industries", testid: "nav-link-industries" },
  { to: "/contact", label: "Contact", testid: "nav-link-contact" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { count, setDrawerOpen } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0B0F19]/92 backdrop-blur-xl transition-all duration-300 ${
        scrolled ? "shadow-2xl shadow-black/30" : ""
      }`}
      data-testid="main-navbar"
    >
      <div className="hidden border-b border-white/5 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 sm:px-6 lg:px-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400">
            Manufacturer & Supplier of Auto Parts & S.S. Nipple Pipe Fittings
          </p>
          <div className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-amber-500" /> +91 98765 43210
            </span>
            <span>sales@parishramengineering.in</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? "h-14" : "h-[72px]"}`}>
          <Link to="/" className="flex items-center gap-3" data-testid="nav-logo">
            <LogoMark className={scrolled ? "h-8 w-8" : "h-9 w-9"} />
            <LogoType light compact={scrolled} />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" data-testid="desktop-nav">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                data-testid={l.testid}
                className={({ isActive }) =>
                  `group relative font-mono text-[11px] uppercase tracking-[0.18em] transition-colors duration-200 ${
                    isActive ? "text-amber-500" : "text-slate-300 hover:text-white"
                  }`
                }
              >
                {l.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-amber-500 transition-all duration-300 group-hover:w-full" />
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setDrawerOpen(true)}
              className="relative grid h-10 w-10 place-items-center border border-white/15 text-slate-200 transition-colors hover:border-amber-500/60 hover:text-amber-500"
              data-testid="quote-cart-button"
              aria-label="Open quote cart"
            >
              <ClipboardList className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              {count > 0 && (
                <span
                  className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center bg-amber-600 px-1 font-mono text-[10px] font-bold text-white"
                  data-testid="quote-cart-count"
                >
                  {count}
                </span>
              )}
            </button>
            <Link
              to={user ? "/account" : "/login"}
              className="hidden h-10 w-10 place-items-center border border-white/15 text-slate-200 transition-colors hover:border-amber-500/60 hover:text-amber-500 sm:grid"
              data-testid="account-nav-button"
              aria-label="Account"
            >
              <User className="h-[18px] w-[18px]" />
            </Link>
            <button
              onClick={() => navigate("/quote")}
              className="hidden h-10 items-center gap-2 bg-amber-600 px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-500 active:scale-95 md:flex"
              data-testid="get-quote-nav-button"
            >
              Get a Quote
            </button>
            <button
              onClick={() => setOpen(!open)}
              className="grid h-10 w-10 place-items-center border border-white/15 text-slate-200 lg:hidden"
              data-testid="mobile-menu-button"
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <nav className="border-t border-white/10 bg-[#0B0F19] px-4 pb-6 pt-3 lg:hidden" data-testid="mobile-nav">
          {LINKS.map((l, i) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              data-testid={`mobile-${l.testid}`}
              className="flex items-center justify-between border-b border-white/5 py-3.5 font-display text-lg font-bold uppercase tracking-tight text-slate-200"
            >
              {l.label}
              <span className="font-mono text-[10px] text-amber-600">0{i + 1}</span>
            </NavLink>
          ))}
          <div className="mt-4 flex gap-3">
            <Link
              to={user ? "/account" : "/login"}
              onClick={() => setOpen(false)}
              className="flex h-11 flex-1 items-center justify-center border border-white/15 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-200"
              data-testid="mobile-account-button"
            >
              {user ? "My Account" : "Login"}
            </Link>
            <Link
              to="/quote"
              onClick={() => setOpen(false)}
              className="flex h-11 flex-1 items-center justify-center bg-amber-600 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white"
              data-testid="mobile-get-quote-button"
            >
              Get a Quote
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export const MobileCTA = () => {
  const { drawerOpen } = useCart();
  if (drawerOpen) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-[#0B0F19]/95 backdrop-blur-xl md:hidden" data-testid="mobile-sticky-cta">
      <a
        href="tel:+919876543210"
        className="flex h-12 flex-1 items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-300"
        data-testid="mobile-call-button"
      >
        <Phone className="h-4 w-4 text-amber-500" /> Call Now
      </a>
      <Link
        to="/quote"
        className="flex h-12 flex-1 items-center justify-center bg-amber-600 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white"
        data-testid="mobile-quote-cta"
      >
        Get a Quote
      </Link>
    </div>
  );
};
