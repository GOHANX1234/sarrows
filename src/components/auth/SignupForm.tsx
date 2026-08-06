"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from "lucide-react";

/* ── Password length indicator ─────────────────────── */
function getLengthIndicator(pw: string): { bars: number; label: string; color: string } {
  if (!pw) return { bars: 0, label: "", color: "" };
  if (pw.length < 8)  return { bars: 1, label: "Too short", color: "#ef4444" };
  if (pw.length < 12) return { bars: 2, label: "Good",      color: "#eab308" };
  if (pw.length < 16) return { bars: 3, label: "Strong",    color: "#22c55e" };
  return                     { bars: 4, label: "Very strong", color: "#10b981" };
}

/* ── Field wrapper ─────────────────────────────────── */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><span>⚠</span>{error}</p>}
    </div>
  );
}

/* ── Input base classes ────────────────────────────── */
const inputCls = "w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 text-sm text-white placeholder-gray-600 outline-none transition-all duration-200 focus:border-sarrows-red/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-sarrows-red/15";

export default function SignupForm() {
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(false);

  const indicator = useMemo(() => getLengthIndicator(password), [password]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim(), email: email.toLowerCase().trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.fieldErrors ?? { general: data.error || "Sign up failed. Please try again." });
        return;
      }
      router.push("/login?registered=1");
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">

      {/* Nickname */}
      <Field label="Nickname" error={errors.nickname}>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="cooluser"
            required
            minLength={3}
            maxLength={20}
            autoComplete="username"
            className={`${inputCls} pl-10`}
          />
        </div>
      </Field>

      {/* Email */}
      <Field label="Email" error={errors.email}>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            className={`${inputCls} pl-10`}
          />
        </div>
      </Field>

      {/* Password */}
      <Field label="Password" error={errors.password}>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            autoComplete="new-password"
            className={`${inputCls} pl-10 pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            tabIndex={-1}
            aria-label={showPw ? "Hide password" : "Show password"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-0.5"
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Length indicator */}
        {password.length > 0 && (
          <div className="mt-2 space-y-1.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{ background: n <= indicator.bars ? indicator.color : "rgba(255,255,255,0.08)" }}
                />
              ))}
            </div>
            <p className="text-xs font-medium transition-colors" style={{ color: indicator.color }}>
              {indicator.label}
            </p>
          </div>
        )}
        {!password && (
          <p className="text-gray-600 text-xs mt-1.5">Minimum 8 characters</p>
        )}
      </Field>

      {/* General error */}
      {errors.general && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-400 flex items-start gap-2"
          style={{ background: "rgba(229,9,20,0.08)", border: "1px solid rgba(229,9,20,0.2)" }}>
          <span className="mt-0.5 flex-none">⚠</span>
          <span>{errors.general}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-sarrows-red hover:bg-red-600 active:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all duration-200 text-sm mt-2"
        style={{ boxShadow: loading ? "none" : "0 4px 20px rgba(229,9,20,0.35)" }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating account…
          </>
        ) : "Create Account"}
      </button>

      <p className="text-center text-gray-600 text-xs">
        By signing up you agree to our{" "}
        <Link href="/terms" className="text-gray-400 hover:text-white underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sarrows-red rounded">Terms of Service</Link>
        {" & "}
        <Link href="/privacy" className="text-gray-400 hover:text-white underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sarrows-red rounded">Privacy Policy</Link>.
      </p>
    </form>
  );
}
