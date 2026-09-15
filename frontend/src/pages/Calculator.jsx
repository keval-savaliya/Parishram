import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Calculator as CalcIcon, Info } from "lucide-react";
import { Reveal } from "../components/Reveal";

const NPS_TABLE = [
  { nps: '1/4"', od: 13.7, sch40: 2.24, sch80: 3.02, sch160: 3.68 },
  { nps: '3/8"', od: 17.1, sch40: 2.31, sch80: 3.2, sch160: 4.01 },
  { nps: '1/2"', od: 21.3, sch40: 2.77, sch80: 3.73, sch160: 4.78 },
  { nps: '3/4"', od: 26.7, sch40: 2.87, sch80: 3.91, sch160: 5.56 },
  { nps: '1"', od: 33.4, sch40: 3.38, sch80: 4.55, sch160: 6.35 },
  { nps: '1-1/2"', od: 48.3, sch40: 3.68, sch80: 5.08, sch160: 7.14 },
  { nps: '2"', od: 60.3, sch40: 3.91, sch80: 5.54, sch160: 8.74 },
  { nps: '3"', od: 88.9, sch40: 5.49, sch80: 7.62, sch160: 11.13 },
  { nps: '4"', od: 114.3, sch40: 6.02, sch80: 8.56, sch160: 13.49 },
];

const SCHEDS = [
  { key: "sch40", label: "SCH 40" },
  { key: "sch80", label: "SCH 80" },
  { key: "sch160", label: "SCH 160" },
];

const GRADES = [
  { label: "SS 304", s: 137 },
  { label: "SS 316", s: 137 },
  { label: "SS 316L", s: 115 },
  { label: "Carbon Steel (EN8)", s: 130 },
];

const Chip = ({ active, onClick, children, testid }) => (
  <button
    onClick={onClick}
    className={`h-11 border px-4 font-mono text-xs tracking-wide transition-all duration-200 ${
      active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-slate-950"
    }`}
    data-testid={testid}
  >
    {children}
  </button>
);

export default function Calculator() {
  const [npsIdx, setNpsIdx] = useState(3);
  const [sched, setSched] = useState("sch40");
  const [gradeIdx, setGradeIdx] = useState(0);
  const navigate = useNavigate();

  const r = useMemo(() => {
    const pipe = NPS_TABLE[npsIdx];
    const t = pipe[sched];
    const od = pipe.od;
    const weight = 0.02466 * t * (od - t);
    const burstMPa = (2 * GRADES[gradeIdx].s * t) / od;
    const burstPSI = burstMPa * 145.04;
    return { t, od, weight, burstPSI, workingPSI: burstPSI / 4 };
  }, [npsIdx, sched, gradeIdx]);

  const sendToQuote = () => {
    const note = `Engineering calculator enquiry — NPS ${NPS_TABLE[npsIdx].nps} ${SCHEDS.find((s) => s.key === sched).label}, ${GRADES[gradeIdx].label}: weight ${r.weight.toFixed(2)} kg/m, est. burst pressure ${Math.round(r.burstPSI).toLocaleString("en-IN")} PSI, recommended working ${Math.round(r.workingPSI).toLocaleString("en-IN")} PSI (safety factor 4). Please quote nipples/fittings to this spec.`;
    try {
      sessionStorage.setItem("pe_calc_note", note);
    } catch {}
    navigate("/quote");
  };

  return (
    <div className="bg-[#F8FAFC]" data-testid="calculator-page">
      <section className="relative overflow-hidden bg-[#090D16] pb-20 pt-36 lg:pt-48">
        <div className="blueprint-grid absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="eyebrow !text-amber-500">Engineering Tool</p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              Pipe Spec <span className="text-amber-500">Calculator</span>
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Estimate pipe weight and pressure ratings for your nipple and fitting requirements,
              then send the result straight to our sales engineers.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="space-y-8">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Nominal Pipe Size (NPS)</p>
                <div className="mt-3 flex flex-wrap gap-2" data-testid="calc-nps">
                  {NPS_TABLE.map((p, i) => (
                    <Chip key={p.nps} active={npsIdx === i} onClick={() => setNpsIdx(i)} testid={`calc-nps-${i}`}>
                      {p.nps}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Wall Schedule</p>
                <div className="mt-3 flex flex-wrap gap-2" data-testid="calc-sched">
                  {SCHEDS.map((s) => (
                    <Chip key={s.key} active={sched === s.key} onClick={() => setSched(s.key)} testid={`calc-${s.key}`}>
                      {s.label}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Alloy Grade</p>
                <div className="mt-3 flex flex-wrap gap-2" data-testid="calc-grade">
                  {GRADES.map((g, i) => (
                    <Chip key={g.label} active={gradeIdx === i} onClick={() => setGradeIdx(i)} testid={`calc-grade-${i}`}>
                      {g.label}
                    </Chip>
                  ))}
                </div>
              </div>
              <p className="flex items-start gap-2 border border-amber-600/30 bg-amber-50 p-4 font-mono text-[11px] leading-relaxed text-amber-800" data-testid="calc-disclaimer">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                Indicative values for estimation only (Barlow's formula, allowable stress per ASME B31.3).
                Confirm final ratings with our engineers before design use.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="sticky top-32 border border-white/10 bg-[#0B0F19] p-7 sm:p-9" data-testid="calc-results">
              <div className="flex items-center gap-3">
                <CalcIcon className="h-5 w-5 text-amber-500" />
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-400">Computed Specification</p>
              </div>
              <p className="mt-4 font-display text-xl font-bold uppercase tracking-tight text-white" data-testid="calc-selection">
                NPS {NPS_TABLE[npsIdx].nps} · {SCHEDS.find((s) => s.key === sched).label} · {GRADES[gradeIdx].label}
              </p>
              <p className="mt-1 font-mono text-[11px] text-slate-500">
                OD {r.od} mm · Wall {r.t} mm
              </p>
              <div className="mt-7 grid grid-cols-1 gap-px border border-white/10 bg-white/10 sm:grid-cols-3">
                <div className="bg-[#0B0F19] p-5">
                  <p className="font-display text-2xl font-extrabold text-amber-500 sm:text-3xl" data-testid="calc-weight">{r.weight.toFixed(2)}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">kg / metre</p>
                </div>
                <div className="bg-[#0B0F19] p-5">
                  <p className="font-display text-2xl font-extrabold text-white sm:text-3xl" data-testid="calc-burst">{Math.round(r.burstPSI).toLocaleString("en-IN")}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">Est. burst PSI</p>
                </div>
                <div className="bg-[#0B0F19] p-5">
                  <p className="font-display text-2xl font-extrabold text-white sm:text-3xl" data-testid="calc-working">{Math.round(r.workingPSI).toLocaleString("en-IN")}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">Working PSI (SF 4)</p>
                </div>
              </div>
              <button
                onClick={sendToQuote}
                className="mt-8 flex h-12 w-full items-center justify-center gap-2 bg-amber-600 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all hover:bg-amber-500 active:scale-[0.98]"
                data-testid="calc-send-to-quote"
              >
                Send This Spec to Quote Enquiry <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
