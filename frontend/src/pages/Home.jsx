import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, ChevronDown, Car, Tractor, Gauge, Droplets, FlaskConical, Container } from "lucide-react";
import { api } from "../lib/api";
import { MaskedLine, Marquee, Reveal } from "../components/Reveal";
import { ProductCard } from "../components/ProductCard";

const IMG = {
  hero: "https://images.unsplash.com/photo-1666634157070-6fd830fb5672?crop=entropy&cs=srgb&fm=jpg&q=85&w=1800",
  fittings: "https://images.unsplash.com/photo-1642797735471-3e90055c5ff9?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  auto: "https://images.unsplash.com/photo-1602664876866-d3b33b77756b?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  cnc: "https://images.unsplash.com/photo-1624841970647-87dce8628d72?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
  weld: "https://images.unsplash.com/photo-1730584474401-5a03c6d1b2d1?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
  qa: "https://images.unsplash.com/photo-1579107821380-a2f5df32d67f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
  factory: "https://images.unsplash.com/photo-1513828742140-ccaa28f3eda0?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
};

const MARQUEE_ITEMS = [
  "SS 304 / 316 / 316L",
  "NPT · BSP · BSPT Threads",
  "ISO 9001:2015 Certified",
  "±0.01 mm Tolerance",
  "OEM & Aftermarket Supply",
  "3000 PSI Hydro-Tested",
  "Pan-India B2B Dispatch",
];

const CHAPTERS = [
  { n: "01", title: "Micro-Precision Metallurgy", text: "Every fitting begins as certified bar stock — SS 304, 316, 316L and EN-series alloys, verified by PMI spectrometry before a single cut is made.", img: IMG.cnc },
  { n: "02", title: "Certified Quality Assurance", text: "Hydro-testing to 3000 PSI, CMM dimensional inspection and EN 10204 3.1 mill test certificates on demand. Zero-defect dispatch is the standard, not the goal.", img: IMG.qa },
  { n: "03", title: "Custom OEM Manufacturing", text: "Send a drawing, a sample or a problem. Our CNC turning and machining cell produces drawing-exact components with ±0.01 mm repeatability at production scale.", img: IMG.weld },
  { n: "04", title: "Pan-India B2B Supply Network", text: "From Rajkot to every industrial hub in India — batch-traceable, export-packed and dispatched on schedule for OEMs, distributors and project contractors.", img: IMG.factory },
];

const INDUSTRIES = [
  { icon: Car, label: "Automotive OEM" },
  { icon: Tractor, label: "Agriculture & Tractors" },
  { icon: Gauge, label: "Hydraulics & Pneumatics" },
  { icon: Droplets, label: "Plumbing & Sanitary" },
  { icon: FlaskConical, label: "Chemical & Process" },
  { icon: Container, label: "Earthmoving & Infra" },
];

const STATS = [
  { v: "25+", l: "Years of Manufacturing" },
  { v: "400+", l: "SKUs in Production" },
  { v: "3000", l: "PSI Hydro-Test Rating" },
  { v: "±0.01", l: "mm Machining Tolerance" },
];

const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0.15]);

  return (
    <section ref={ref} className="relative flex min-h-[100svh] items-end overflow-hidden bg-[#090D16]" data-testid="hero-section">
      <motion.div style={{ y: bgY }} className="absolute inset-0 scale-110">
        <img src={IMG.hero} alt="CNC machined stainless steel components" className="h-full w-full object-cover" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#090D16]/95 via-[#090D16]/70 to-[#090D16]/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#090D16] via-transparent to-[#090D16]/60" />
      <div className="blueprint-grid absolute inset-0 opacity-60" />

      <motion.div style={{ opacity: fade }} className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-24 pt-40 sm:px-6 lg:px-8">
        <MaskedLine delay={0.15}>
          <span className="eyebrow !text-amber-500">Parishram Engineering — Rajkot, Gujarat · Est. 1998</span>
        </MaskedLine>
        <h1 className="mt-6 font-display font-black uppercase leading-[0.95] tracking-tight" data-testid="hero-headline">
          <MaskedLine delay={0.3}>
            <span className="text-4xl text-white sm:text-6xl lg:text-7xl xl:text-8xl">Precision</span>
          </MaskedLine>
          <MaskedLine delay={0.45}>
            <span className="text-outline text-4xl sm:text-6xl lg:text-7xl xl:text-8xl">Manufacturing</span>
          </MaskedLine>
          <MaskedLine delay={0.6}>
            <span className="text-4xl text-amber-500 sm:text-6xl lg:text-7xl xl:text-8xl">In Stainless Steel.</span>
          </MaskedLine>
        </h1>
        <MaskedLine delay={0.8}>
          <p className="mt-7 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            All types of auto parts and S.S. nipple pipe fittings — machined, tested and dispatched
            from our Rajkot plant for OEMs, distributors and project buyers across India.
          </p>
        </MaskedLine>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-9 flex flex-wrap items-center gap-4"
        >
          <Link
            to="/products"
            className="group flex h-12 items-center gap-3 bg-amber-600 px-7 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-500 active:scale-95"
            data-testid="hero-explore-products"
          >
            Explore Products
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            to="/quote"
            className="flex h-12 items-center gap-3 border border-white/25 px-7 font-mono text-xs uppercase tracking-[0.2em] text-white backdrop-blur-sm transition-colors duration-200 hover:border-amber-500 hover:text-amber-500"
            data-testid="hero-get-quote"
          >
            Get a Quote
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.25, duration: 0.8 }}
          className="mt-16 grid grid-cols-2 gap-px border border-white/10 bg-white/10 backdrop-blur-sm md:grid-cols-4"
          data-testid="hero-stats"
        >
          {STATS.map((s) => (
            <div key={s.l} className="bg-[#090D16]/70 px-5 py-4">
              <p className="font-display text-2xl font-extrabold text-white sm:text-3xl">
                {s.v}
                <span className="text-amber-500">{s.l.startsWith("mm") ? "" : ""}</span>
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">{s.l}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 text-slate-400 lg:block"
      >
        <ChevronDown className="h-5 w-5" />
      </motion.div>
    </section>
  );
};

const Categories = () => (
  <section className="blueprint-grid-light bg-[#F8FAFC] py-20 lg:py-28" data-testid="categories-section">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <Reveal>
        <p className="eyebrow">01 — What We Manufacture</p>
        <h2 className="mt-4 max-w-2xl font-display text-3xl font-extrabold uppercase tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
          Two product lines. One standard of precision.
        </h2>
      </Reveal>
      <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
        {[
          { title: "S.S. Nipple Pipe Fittings", desc: "Hex, barrel, reducing, close, welding and hose nipples in SS 304 / 316 / 316L — NPT, BSP and BSPT threads.", img: IMG.fittings, to: "/products?category=S.S.%20Nipple%20Pipe%20Fittings", testid: "category-fittings" },
          { title: "Auto Parts", desc: "CNC-turned bushings, shafts, flanges, pins and hydraulic adapters built to OEM drawings and tolerances.", img: IMG.auto, to: "/products?category=Auto%20Parts", testid: "category-autoparts" },
        ].map((c, i) => (
          <Reveal key={c.title} delay={i * 0.12}>
            <Link to={c.to} className="group relative block overflow-hidden" data-testid={c.testid}>
              <div className="clip-corner relative aspect-[16/10] overflow-hidden">
                <img src={c.img} alt={c.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <span className="absolute right-5 top-5 grid h-11 w-11 place-items-center border border-white/30 text-white backdrop-blur-sm transition-all duration-300 group-hover:border-amber-500 group-hover:bg-amber-600">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-500">Category 0{i + 1}</span>
                  <h3 className="mt-2 font-display text-2xl font-extrabold uppercase tracking-tight text-white sm:text-3xl">{c.title}</h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-300">{c.desc}</p>
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

const Featured = () => {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    api.get("/products?featured=true").then(({ data }) => setProducts(data.slice(0, 4))).catch(() => {});
  }, []);
  return (
    <section className="border-y border-slate-200 bg-white py-20 lg:py-28" data-testid="featured-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <p className="eyebrow">02 — Featured Range</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold uppercase tracking-tight text-slate-900 sm:text-4xl">
              Production-line favourites
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <Link to="/products" className="group flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-slate-600 transition-colors hover:text-amber-700" data-testid="view-all-products-link">
              Full Catalogue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.product_id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

const Manifesto = () => (
  <section className="bg-[#090D16] py-20 lg:py-28" data-testid="manifesto-section">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <Reveal>
        <p className="eyebrow !text-amber-500">03 — The Parishram Standard</p>
        <h2 className="mt-4 max-w-3xl font-display text-3xl font-extrabold uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
          A manifesto written in microns.
        </h2>
      </Reveal>
      <div className="mt-16 space-y-0 border-t border-white/10">
        {CHAPTERS.map((c, i) => (
          <Reveal key={c.n} delay={0.05}>
            <div className={`group grid items-center gap-8 border-b border-white/10 py-12 lg:grid-cols-12 lg:gap-12 ${i % 2 ? "" : ""}`}>
              <div className={`lg:col-span-2 ${i % 2 ? "lg:order-3" : ""}`}>
                <span className="font-display text-6xl font-black text-white/10 transition-colors duration-500 group-hover:text-amber-600/40 lg:text-7xl">{c.n}</span>
              </div>
              <div className={`lg:col-span-6 ${i % 2 ? "lg:order-2" : ""}`}>
                <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight text-white sm:text-3xl">{c.title}</h3>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">{c.text}</p>
              </div>
              <div className={`lg:col-span-4 ${i % 2 ? "lg:order-1" : ""}`}>
                <div className="clip-corner overflow-hidden">
                  <img src={c.img} alt={c.title} loading="lazy" className="aspect-[16/10] w-full object-cover grayscale-[35%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0" />
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

const IndustriesPreview = () => (
  <section className="bg-[#F8FAFC] py-20 lg:py-28" data-testid="industries-preview">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <Reveal>
        <p className="eyebrow">04 — Industries Served</p>
        <h2 className="mt-4 max-w-2xl font-display text-3xl font-extrabold uppercase tracking-tight text-slate-900 sm:text-4xl">
          Where our components go to work
        </h2>
      </Reveal>
      <div className="mt-12 grid grid-cols-2 gap-px border border-slate-200 bg-slate-200 md:grid-cols-3">
        {INDUSTRIES.map((ind, i) => (
          <Reveal key={ind.label} delay={i * 0.05} className="h-full">
            <div className="group flex h-full flex-col gap-4 bg-white p-6 transition-colors duration-300 hover:bg-slate-950 sm:p-8" data-testid={`industry-tile-${i}`}>
              <ind.icon className="h-7 w-7 text-amber-600 transition-transform duration-300 group-hover:-translate-y-1" />
              <span className="font-display text-base font-bold uppercase tracking-tight text-slate-900 transition-colors group-hover:text-white sm:text-lg">
                {ind.label}
              </span>
              <span className="mt-auto font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 group-hover:text-amber-500">
                Sector 0{i + 1}
              </span>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.15}>
        <Link to="/industries" className="mt-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-slate-600 transition-colors hover:text-amber-700" data-testid="industries-explore-link">
          Explore Applications <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>
    </div>
  </section>
);

const CTABand = () => (
  <section className="relative overflow-hidden bg-slate-950 py-20 lg:py-24" data-testid="cta-band">
    <div className="blueprint-grid absolute inset-0" />
    <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-amber-600/10 blur-3xl" />
    <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <Reveal>
        <p className="eyebrow !text-amber-500">Ready when you are</p>
        <h2 className="mt-4 max-w-xl font-display text-3xl font-extrabold uppercase tracking-tight text-white sm:text-4xl">
          Need a custom OEM component or bulk fitting supply?
        </h2>
        <p className="mt-3 max-w-lg text-sm text-slate-400">
          Share your drawing, grade and quantity — our engineers respond with a formal quotation within 24 hours.
        </p>
      </Reveal>
      <Reveal delay={0.1}>
        <Link
          to="/quote"
          className="group flex h-14 items-center gap-3 bg-amber-600 px-8 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-500 active:scale-95"
          data-testid="cta-get-quote"
        >
          Request Quotation <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Reveal>
    </div>
  </section>
);

export default function Home() {
  return (
    <div data-testid="home-page">
      <Hero />
      <Marquee items={MARQUEE_ITEMS} />
      <Categories />
      <Featured />
      <Manifesto />
      <IndustriesPreview />
      <CTABand />
    </div>
  );
}
