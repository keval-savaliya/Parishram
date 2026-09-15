import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];

export const Reveal = ({ children, delay = 0, className = "", y = 30 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.7, delay, ease: EASE }}
  >
    {children}
  </motion.div>
);

export const MaskedLine = ({ children, delay = 0, className = "" }) => (
  <span className={`block overflow-hidden ${className}`}>
    <motion.span
      className="block will-change-transform"
      initial={{ y: "110%" }}
      animate={{ y: 0 }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.span>
  </span>
);

export const Marquee = ({ items, dark = false, className = "" }) => {
  const row = [...items, ...items];
  return (
    <div
      className={`overflow-hidden border-y ${
        dark ? "border-white/10 bg-[#0B0F19]" : "border-slate-200 bg-white"
      } ${className}`}
      data-testid="editorial-marquee"
    >
      <div className="marquee-track items-center gap-0 py-4">
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center">
            {items.map((item, i) => (
              <span key={`${half}-${i}`} className="flex items-center">
                <span
                  className={`font-mono text-xs sm:text-sm uppercase tracking-[0.3em] ${
                    dark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {item}
                </span>
                <span className="mx-10 inline-block h-1.5 w-1.5 rotate-45 bg-amber-600" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
