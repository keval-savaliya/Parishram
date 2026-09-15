// Placeholder logo mark — replace the SVG below with the final brand image
// without touching layout (fixed h-9 w-9 frame).
export const LogoMark = ({ className = "h-9 w-9" }) => (
  <div
    className={`${className} shrink-0 border border-amber-500/60 bg-slate-900 grid place-items-center`}
    data-testid="logo-placeholder"
    title="Placeholder logo — replace with final Parishram Engineering logo"
  >
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-amber-500">
      <path
        d="M12 2 L21 7 V17 L12 22 L3 17 V7 Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  </div>
);

export const LogoType = ({ light = true, compact = false }) => (
  <div className="leading-none">
    <span
      className={`font-display font-extrabold tracking-tight uppercase ${
        compact ? "text-sm" : "text-base sm:text-lg"
      } ${light ? "text-white" : "text-slate-900"}`}
    >
      Parishram
    </span>
    <span
      className={`block font-mono text-[9px] sm:text-[10px] tracking-[0.32em] uppercase ${
        light ? "text-amber-500" : "text-amber-600"
      }`}
    >
      Engineering
    </span>
  </div>
);
