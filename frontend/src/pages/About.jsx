import { Reveal, Marquee } from "../components/Reveal";

const IMG = {
  factory: "https://images.unsplash.com/photo-1513828742140-ccaa28f3eda0?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
  cnc: "https://images.unsplash.com/photo-1624841970647-87dce8628d72?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
  qa: "https://images.unsplash.com/photo-1579107821380-a2f5df32d67f?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
  weld: "https://images.unsplash.com/photo-1730584474401-5a03c6d1b2d1?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000",
};

const TIMELINE = [
  { year: "1999", text: "Started with bearing cleaning work: rough bearings were cleaned and supplied on a commission basis." },
  { year: "2010", text: "Moved into stainless steel nipple manufacturing and began building our own product range." },
  { year: "2018", text: "Introduced CNC machines to improve precision, consistency and production capacity." },
  { year: "Present", text: "Pan-India distributor network across all states; export-grade packing line added." },
];

export default function About() {
  return (
    <div className="bg-[#F8FAFC]" data-testid="about-page">
      <section className="relative overflow-hidden bg-[#090D16] pb-20 pt-36 lg:pt-48">
        <div className="blueprint-grid absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="eyebrow !text-amber-500">About Parishram Engineering</p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              Parishram means <span className="text-amber-500">hard work.</span> We machine it into every part.
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              From a two-lathe workshop in 1999 to a CNC-driven manufacturing plant, Parishram
              Engineering has grown on one principle: components that pass inspection the first
              time, every time.
            </p>
          </Reveal>
        </div>
      </section>

      <Marquee items={["Est. 1999 — Rajkot", "CNC Turning & Machining", "ISO 9001:2015", "SS 304 · 316 · 316L", "OEM Drawing Production"]} />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="clip-corner overflow-hidden">
              <img src={IMG.factory} alt="Parishram Engineering plant" loading="lazy" className="aspect-[4/3] w-full object-cover" />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow">The Plant</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold uppercase tracking-tight text-slate-900 sm:text-4xl">
              Turning, threading, testing — under one roof
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-slate-600 sm:text-base">
              Our Rajkot facility houses CNC turning centres, automatic threading lines, centreless
              grinders and a dedicated inspection lab. Raw material enters as certified bar stock and
              leaves as batch-traceable, hydro-tested components.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-px border border-slate-200 bg-slate-200">
              {[
                { v: "12,000", l: "sq ft plant" },
                { v: "28", l: "machines" },
                { v: "40+", l: "people" },
              ].map((s) => (
                <div key={s.l} className="bg-white px-4 py-5 text-center">
                  <p className="font-display text-2xl font-extrabold text-slate-900">{s.v}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{s.l}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="eyebrow">Milestones</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold uppercase tracking-tight text-slate-900 sm:text-4xl">25+ years, chapter by chapter</h2>
          </Reveal>
          <div className="mt-12 space-y-0 border-t border-slate-200">
            {TIMELINE.map((t, i) => (
              <Reveal key={t.year} delay={0.05}>
                <div className="group grid gap-2 border-b border-slate-200 py-7 sm:grid-cols-12 sm:items-center" data-testid={`timeline-${t.year}`}>
                  <span className="font-display text-3xl font-black text-slate-400 transition-colors group-hover:text-amber-600 sm:col-span-2 sm:text-4xl">{t.year}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-700 sm:col-span-2">Phase 0{i + 1}</span>
                  <p className="text-sm leading-relaxed text-slate-600 sm:col-span-8">{t.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <Reveal>
          <p className="eyebrow">Capability</p>
          <h2 className="mt-4 font-display text-3xl font-extrabold uppercase tracking-tight text-slate-900 sm:text-4xl">What the floor can do</h2>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { img: IMG.cnc, t: "CNC Machining", d: "Turning, milling, drilling and grinding with ±0.01 mm repeatability across production batches." },
            { img: IMG.weld, t: "Threading & Fabrication", d: "NPT, BSP, BSPT and metric threading up to 4 inches, plus weld-prep to ASME B16.25." },
            { img: IMG.qa, t: "Inspection & Testing", d: "PMI spectrometry, CMM dimensional reports, hydro-testing to 3000 PSI and MTC documentation." },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 0.08} className="h-full">
              <div className="group h-full border border-slate-200 bg-white transition-colors hover:border-amber-600/50">
                <div className="clip-corner overflow-hidden">
                  <img src={c.img} alt={c.t} loading="lazy" className="aspect-[16/9] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-xl font-bold uppercase tracking-tight text-slate-900">{c.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
