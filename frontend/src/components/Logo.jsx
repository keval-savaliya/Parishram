export const LogoMark = ({ className = "h-9 w-9" }) => (
  <div className={`${className} shrink-0 overflow-hidden bg-transparent`} data-testid="logo-image">
    <img src="/logo.png?v=4" alt="Parishram Engineering logo" className="block h-full w-full object-contain" />
  </div>
);

export const LogoType = ({ light = true, compact = false }) => (
  <div className="leading-none">
    <span
      className={`font-display font-extrabold tracking-tight uppercase ${
        compact ? "text-sm" : "text-base sm:text-lg"
      } ${light ? "text-sky-400" : "text-sky-700"}`}
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
