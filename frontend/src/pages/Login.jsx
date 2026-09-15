import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { LogoMark } from "../components/Logo";
import { Reveal } from "../components/Reveal";

const inputCls =
  "h-12 w-full border border-white/15 bg-white/5 px-4 font-mono text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-amber-500";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload = mode === "login" ? { email: form.email, password: form.password } : form;
      const { data } = await api.post(endpoint, payload);
      setUser(data);
      toast.success(mode === "login" ? "Welcome back" : "Account created");
      navigate("/account");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/account";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#090D16] px-4 py-32" data-testid="login-page">
      <div className="blueprint-grid absolute inset-0" />
      <div className="absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-amber-600/10 blur-3xl" />
      <Reveal className="relative w-full max-w-md">
        <div className="border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl sm:p-10">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <p className="font-display text-lg font-extrabold uppercase tracking-tight text-white">Parishram Engineering</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-500">Customer Account</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-px border border-white/10 bg-white/10">
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`h-11 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${
                  mode === m ? "bg-amber-600 font-semibold text-white" : "bg-transparent text-slate-400 hover:text-white"
                }`}
                data-testid={`auth-mode-${m}`}
              >
                {m === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-7 space-y-4" data-testid="auth-form">
            {mode === "register" && (
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
                required
                className={inputCls}
                data-testid="auth-name-input"
              />
            )}
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              type="email"
              placeholder="Email address"
              required
              className={inputCls}
              data-testid="auth-email-input"
            />
            <input
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              type="password"
              placeholder="Password (min 6 chars)"
              required
              minLength={6}
              className={inputCls}
              data-testid="auth-password-input"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 bg-amber-600 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all hover:bg-amber-500 active:scale-[0.98] disabled:opacity-50"
              data-testid="auth-submit-button"
            >
              {mode === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {loading ? "Please wait…" : mode === "login" ? "Login" : "Create Account"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-white/10" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">or</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <button
            onClick={googleLogin}
            className="flex h-12 w-full items-center justify-center gap-3 border border-white/15 font-mono text-xs uppercase tracking-[0.15em] text-slate-200 transition-colors hover:border-amber-500/60 hover:text-white"
            data-testid="google-login-button"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.7 0 3.22.59 4.42 1.73l3.29-3.29C17.72 1.64 15.06.5 12 .5 7.4.5 3.44 3.13 1.42 6.99l3.83 2.97C6.18 7.14 8.86 5.04 12 5.04z" />
              <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45c-.28 1.5-1.12 2.77-2.39 3.62l3.71 2.88c2.17-2 3.73-4.95 3.73-8.69z" />
              <path fill="#FBBC05" d="M5.25 14.04a7.2 7.2 0 0 1 0-4.08L1.42 6.99a11.5 11.5 0 0 0 0 10.02l3.83-2.97z" />
              <path fill="#34A853" d="M12 23.5c3.06 0 5.63-1.01 7.5-2.74l-3.71-2.88c-1.03.69-2.35 1.1-3.79 1.1-3.14 0-5.82-2.1-6.75-4.94l-3.83 2.97C3.44 20.87 7.4 23.5 12 23.5z" />
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
            Save quote history & track enquiries
          </p>
        </div>
        <p className="mt-6 text-center">
          <Link to="/" className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-amber-500" data-testid="back-home-link">
            Back to site
          </Link>
        </p>
      </Reveal>
    </div>
  );
}
