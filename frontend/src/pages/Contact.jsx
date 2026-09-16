import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "../lib/api";
import { Reveal } from "../components/Reveal";

const initial = { name: "", email: "", phone: "", subject: "", message: "" };

export default function Contact() {
  const [form, setForm] = useState(initial);
  const [sending, setSending] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill name, email and message");
      return;
    }
    setSending(true);
    try {
      await api.post("/contact", form);
      toast.success("Message sent", { description: "Our team will respond within one working day." });
      setForm(initial);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    "h-12 w-full border border-slate-300 bg-white px-4 font-mono text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-amber-600";

  return (
    <div className="bg-[#F8FAFC]" data-testid="contact-page">
      <section className="relative overflow-hidden bg-[#090D16] pb-20 pt-36 lg:pt-48">
        <div className="blueprint-grid absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="eyebrow !text-amber-500">Contact</p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
              Talk to the shop floor, not a call centre.
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
          <Reveal className="lg:col-span-2">
            <div className="space-y-px border border-slate-200 bg-slate-200">
              {[
                { icon: MapPin, label: "Works & Office", value: "SIDC Rd, Veraval, Gujarat 360024, India" },
                { icon: Phone, label: "Phone / WhatsApp", value: "+91 99799 98408" },
                { icon: Mail, label: "Email", value: "kpsavaliya1@gmail.com" },
                { icon: Clock, label: "Working Hours", value: "Open 24 hours" },
              ].map((c) => (
                <div key={c.label} className="flex gap-4 bg-white p-6" data-testid={`contact-info-${c.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                  <c.icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">{c.label}</p>
                    <p className="mt-1.5 text-sm font-medium text-slate-900">{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Placeholder contact details — replace with live business information.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-3">
            <form onSubmit={submit} className="border border-slate-200 bg-white p-7 sm:p-10" data-testid="contact-form">
              <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-slate-900">Send an enquiry</h2>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <input value={form.name} onChange={set("name")} placeholder="Full name *" className={inputCls} data-testid="contact-name-input" />
                <input value={form.email} onChange={set("email")} type="email" placeholder="Email *" className={inputCls} data-testid="contact-email-input" />
                <input value={form.phone} onChange={set("phone")} placeholder="Phone" className={inputCls} data-testid="contact-phone-input" />
                <input value={form.subject} onChange={set("subject")} placeholder="Subject" className={inputCls} data-testid="contact-subject-input" />
                <textarea
                  value={form.message}
                  onChange={set("message")}
                  placeholder="Your requirement — product, grade, quantity… *"
                  rows={6}
                  className="w-full border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-amber-600 sm:col-span-2"
                  data-testid="contact-message-input"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="mt-7 flex h-12 items-center gap-3 bg-slate-950 px-8 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all hover:bg-amber-600 active:scale-95 disabled:opacity-50"
                data-testid="contact-submit-button"
              >
                <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send Message"}
              </button>
            </form>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
