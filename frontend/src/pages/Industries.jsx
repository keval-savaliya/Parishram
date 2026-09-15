import { Link } from "react-router-dom";
import { Car, Tractor, Gauge, Droplets, FlaskConical, Container, ArrowRight } from "lucide-react";
import { Reveal } from "../components/Reveal";

const INDUSTRIES = [
  {
    icon: Car,
    title: "Automotive OEM & Aftermarket",
    text: "Bushings, shafts, pivot pins, spacers and valve bodies machined to OEM drawings for two-wheeler, LCV and passenger-vehicle platforms.",
    points: ["Drawing-exact production", "PPAP-style documentation", "Batch traceability"],
  },
  {
    icon: Tractor,
    title: "Agriculture & Tractors",
    text: "Hydraulic adapters, linkage pins and gear blanks that survive dust, load cycles and monsoon seasons in the field.",
    points: ["Case-hardened pins", "Zinc-nickel corrosion protection", "High-volume turning"],
  },
  {
    icon: Gauge,
    title: "Hydraulics & Pneumatics",
    text: "Fittings and adapters rated to 6000 PSI working pressure, 100% pressure-tested before dispatch.",
    points: ["JIC / ORFS / BSPP ports", "1.5× proof pressure test", "Leak-test certification"],
  },
  {
    icon: Droplets,
    title: "Plumbing & Sanitary",
    text: "S.S. nipple pipe fittings in 304/316 for water, food-grade and architectural installations — NPT, BSP and hose-tail configurations.",
    points: ["SS 304 / 316 / 316L", "Pickled & passivated", "Mirror polish options"],
  },
  {
    icon: FlaskConical,
    title: "Chemical & Process",
    text: "Corrosion-resistant 316L fittings and welding nipples for chemical transfer lines, with MTC and dye-penetrant reports.",
    points: ["EN 10204 3.1 MTC", "DP tested weld ends", "SCH 40–160 walls"],
  },
  {
    icon: Container,
    title: "Earthmoving & Infrastructure",
    text: "Flanges, spacer collars and hardened pins for excavators, loaders and site equipment that cannot afford downtime.",
    points: ["Induction hardened 50–55 HRC", "Heavy-section machining", "Rapid repeat orders"],
  },
];

export default function Industries() {
  return (
    <div className="bg-[#F8FAFC]" data-testid="industries-page">
      <section className="relative overflow-hidden bg-[#090D16] pb-20 pt-36 lg:pt-48">
        <div className="blueprint-grid absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="eyebrow !text-amber-500">Industries & Applications</p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              Trusted where failure is not an option.
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Our components run inside engines, hydraulic circuits, chemical lines and water
              systems across India. Each sector gets material grades and testing matched to its duty cycle.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-px border border-slate-200 bg-slate-200 md:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((ind, i) => (
            <Reveal key={ind.title} delay={(i % 3) * 0.07} className="h-full">
              <div className="group flex h-full flex-col bg-white p-7 transition-colors duration-300 hover:bg-slate-950" data-testid={`industry-card-${i}`}>
                <div className="flex items-center justify-between">
                  <ind.icon className="h-8 w-8 text-amber-600" />
                  <span className="font-display text-4xl font-black text-slate-100 transition-colors group-hover:text-white/10">
                    0{i + 1}
                  </span>
                </div>
                <h2 className="mt-6 font-display text-xl font-bold uppercase tracking-tight text-slate-900 transition-colors group-hover:text-white">
                  {ind.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 transition-colors group-hover:text-slate-400">{ind.text}</p>
                <ul className="mt-5 space-y-2 border-t border-slate-100 pt-5 transition-colors group-hover:border-white/10">
                  {ind.points.map((pt) => (
                    <li key={pt} className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500 transition-colors group-hover:text-amber-500">
                      — {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-14 flex flex-col items-start justify-between gap-6 border border-slate-200 bg-white p-8 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight text-slate-900">
                Your industry not listed?
              </h3>
              <p className="mt-2 text-sm text-slate-600">We machine to drawing — send your requirement and we will confirm feasibility.</p>
            </div>
            <Link
              to="/quote"
              className="group flex h-12 shrink-0 items-center gap-3 bg-slate-950 px-7 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-white transition-all hover:bg-amber-600 active:scale-95"
              data-testid="industries-quote-cta"
            >
              Send Requirement <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
