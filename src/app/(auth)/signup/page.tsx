import SignupForm from "@/components/auth/SignupForm";
import Link from "next/link";
import { Film, Tv2, Star, Shield } from "lucide-react";
import LogoMark from "@/components/ui/LogoMark";

export const metadata = { title: "Sign Up — Sarrows" };

const perks = [
  { icon: Film,   label: "10,000+ movies & anime titles" },
  { icon: Tv2,    label: "New episodes added weekly" },
  { icon: Star,   label: "Ratings & personal watchlist" },
  { icon: Shield, label: "Free to start — no card needed" },
];

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-sarrows-darker flex">

      {/* ── Left brand panel (desktop only) ─────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] xl:w-[55%] relative overflow-hidden px-14 py-12">
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #0f0408 50%, #0a0010 100%)" }} />
        <div className="absolute inset-0 opacity-30"
          style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(229,9,20,0.35) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(120,0,60,0.2) 0%, transparent 50%)" }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")", backgroundSize: "256px 256px" }} />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <LogoMark size={36} className="group-hover:scale-110 transition-transform" />
            <span className="text-xl font-black text-white tracking-tight">SARROWS</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl xl:text-5xl font-black text-white leading-[1.05] tracking-tight mb-4">
              Join thousands<br />of viewers<br />
              <span style={{
                background: "linear-gradient(135deg, #E50914 0%, #ff4757 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}>for free</span>.
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
              No credit card. No commitments. Start watching in seconds.
            </p>
          </div>

          <ul className="space-y-3.5">
            {perks.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none"
                  style={{ background: "rgba(229,9,20,0.15)", border: "1px solid rgba(229,9,20,0.25)" }}>
                  <Icon className="w-4 h-4 text-sarrows-red" />
                </div>
                <span className="text-gray-300 text-sm font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10">
          <p className="text-gray-600 text-xs">
            &copy; {new Date().getFullYear()} Sarrows. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-10 py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(229,9,20,0.06) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />

        <div className="w-full max-w-[400px] animate-fade-in">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <LogoMark size={32} className="group-hover:scale-110 transition-transform" />
              <span className="text-xl font-black text-white tracking-tight">SARROWS</span>
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-1.5 tracking-tight">Create your account</h1>
            <p className="text-gray-500 text-sm">Free forever — no credit card required</p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl p-7 sm:p-8"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
            <SignupForm />
          </div>

          <p className="text-center text-gray-600 text-sm mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-sarrows-red hover:text-red-400 font-semibold transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
