import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { LogoMark, LogoType } from "./Logo";

export const Footer = () => (
  <footer className="border-t border-white/10 bg-[#0B0F19] text-slate-400" data-testid="site-footer">
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <LogoMark />
            <LogoType light />
          </div>
          <p className="mt-5 text-sm leading-relaxed">
            Manufacturer & Supplier of All Types of Auto Parts and S.S. Nipple Pipe Fittings.
            Precision-machined components for OEM and industrial buyers across India.
          </p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-600">
            Logo above is a marked placeholder
          </p>
        </div>
        <div>
          <h4 className="font-mono text-[11px] uppercase tracking-[0.25em] text-amber-500">Company</h4>
          <ul className="mt-5 space-y-3 text-sm">
            <li><Link to="/about" className="transition-colors hover:text-white" data-testid="footer-about-link">About Us</Link></li>
            <li><Link to="/products" className="transition-colors hover:text-white" data-testid="footer-products-link">Products</Link></li>
            <li><Link to="/industries" className="transition-colors hover:text-white" data-testid="footer-industries-link">Industries</Link></li>
            <li><Link to="/quote" className="transition-colors hover:text-white" data-testid="footer-quote-link">Get a Quote</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-mono text-[11px] uppercase tracking-[0.25em] text-amber-500">Products</h4>
          <ul className="mt-5 space-y-3 text-sm">
            <li><Link to="/products?category=S.S.%20Nipple%20Pipe%20Fittings" className="transition-colors hover:text-white" data-testid="footer-fittings-link">S.S. Nipple Pipe Fittings</Link></li>
            <li><Link to="/products?category=Auto%20Parts" className="transition-colors hover:text-white" data-testid="footer-autoparts-link">Auto Parts</Link></li>
            <li><Link to="/products" className="transition-colors hover:text-white" data-testid="footer-all-link">Full Catalogue</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-mono text-[11px] uppercase tracking-[0.25em] text-amber-500">Contact</h4>
          <ul className="mt-5 space-y-3.5 text-sm">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>Plot 24, GIDC Industrial Estate,<br />Rajkot — 360002, Gujarat, India</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-amber-600" /> +91 98765 43210
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-amber-600" /> sales@parishramengineering.in
            </li>
            <li className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 shrink-0 text-amber-600" /> Mon–Sat, 9:00 – 19:00 IST
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-600">
          © {new Date().getFullYear()} Parishram Engineering. All rights reserved.
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-600">
          GSTIN: 24XXXXX0000X1Z5 (placeholder)
        </p>
      </div>
    </div>
  </footer>
);
