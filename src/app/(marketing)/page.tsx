export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { Play, Info, ChevronRight, Film, Tv, Globe, Subtitles, Mic, Sparkles, Send } from "lucide-react";
import LogoMark from "@/components/ui/LogoMark";
import { connectDB } from "@/lib/db";
import Movie from "@/models/Movie";
import Series from "@/models/Series";
import { serialize } from "@/lib/utils";
import TrendingRail from "@/components/marketing/TrendingRail";
import ScrollReveal from "@/components/marketing/ScrollReveal";
import DisclaimerDialog from "@/components/marketing/DisclaimerDialog";

interface CatalogItem {
  title: string;
  slug: string;
  description?: string;
  posterUrl: string;
  bannerUrl?: string;
  releaseYear?: number | null;
  type: "movie" | "anime";
}

async function getCatalogPreview(): Promise<CatalogItem[]> {
  try {
    await connectDB();
    const [movies, series] = await Promise.all([
      Movie.find({ status: "published", posterUrl: { $exists: true, $ne: "" } })
        .sort({ createdAt: -1 })
        .limit(8)
        .select("title slug description posterUrl bannerUrl releaseYear")
        .lean(),
      Series.find({ publishStatus: "published", posterUrl: { $exists: true, $ne: "" } })
        .sort({ createdAt: -1 })
        .limit(8)
        .select("title slug description posterUrl bannerUrl")
        .lean(),
    ]);
    const tag = (arr: any[], type: "movie" | "anime") => arr.map((d) => ({ ...d, type }));
    return serialize([...tag(movies, "movie"), ...tag(series, "anime")]) as unknown as CatalogItem[];
  } catch {
    return [];
  }
}

async function getLatestFeatured(): Promise<CatalogItem | null> {
  try {
    await connectDB();
    const [movie, anime] = await Promise.all([
      Movie.findOne({ status: "published", bannerUrl: { $exists: true, $ne: "" } })
        .sort({ createdAt: -1 })
        .select("title slug description posterUrl bannerUrl releaseYear")
        .lean(),
      Series.findOne({ publishStatus: "published", bannerUrl: { $exists: true, $ne: "" } })
        .sort({ createdAt: -1 })
        .select("title slug description posterUrl bannerUrl")
        .lean(),
    ]);

    const candidates: CatalogItem[] = [
      ...(movie ? [{ ...(movie as any), type: "movie" as const }] : []),
      ...(anime ? [{ ...(anime as any), type: "anime" as const }] : []),
    ];

    if (!candidates.length) return null;

    // Pick whichever was added most recently
    const sorted = candidates.sort((a: any, b: any) =>
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    );
    return serialize(sorted[0]) as unknown as CatalogItem;
  } catch {
    return null;
  }
}

export default async function LandingPage() {
  const [catalog, latestFeatured] = await Promise.all([getCatalogPreview(), getLatestFeatured()]);
  const featured = latestFeatured ?? catalog.find((c) => c.bannerUrl) ?? catalog[0];
  const rail = catalog.length > 0 ? Array.from({ length: Math.max(catalog.length, 10) }, (_, i) => catalog[i % catalog.length]) : [];
  // Pick a different item for the CTA background — prefer something other than the hero item
  // so there's visual variety, but fall back to the hero banner if nothing else has one.
  const ctaBg =
    catalog.find((c) => c.bannerUrl && c.slug !== featured?.slug)?.bannerUrl ??
    featured?.bannerUrl;

  return (
    <div className="min-h-screen bg-sarrows-darker overflow-x-hidden">

      <DisclaimerDialog />

      {/* ── Navbar ───────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-navbar">
        <div
          className="absolute bottom-0 inset-x-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(229,9,20,0.35), transparent)" }}
        />
        <div className="flex items-center justify-between max-w-6xl mx-auto px-4 sm:px-6 md:px-10 h-14 sm:h-16">
          <Link href="/" className="flex items-center gap-2 min-w-0 flex-none">
            <LogoMark size={28} />
            <span className="text-base sm:text-lg font-black text-white tracking-tight truncate">SARROWS</span>
          </Link>

          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            <Link href="/movies" className="text-sm font-medium text-gray-400 hover:text-white transition px-3.5 py-2 rounded-lg hover:bg-white/[0.06]">
              Movies
            </Link>
            <Link href="/anime" className="text-sm font-medium text-gray-400 hover:text-white transition px-3.5 py-2 rounded-lg hover:bg-white/[0.06]">
              Anime
            </Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 flex-none">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition px-2.5 sm:px-3 py-2 rounded-xl hover:bg-white/[0.07]">
              Sign In
            </Link>
            <Link href="/signup" className="btn-primary text-sm py-2 px-3.5 sm:px-4 whitespace-nowrap">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative min-h-[100svh] md:min-h-0 md:h-[72vh] flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0">
          {featured?.bannerUrl ? (
            <Image
              src={featured.bannerUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-top opacity-45"
            />
          ) : (
            <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 20%, rgba(229,9,20,0.18), transparent 55%)" }} />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(5,5,8,0.55) 0%, rgba(5,5,8,0.35) 35%, rgba(5,5,8,0.92) 78%, #050508 100%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(5,5,8,0.95) 0%, rgba(5,5,8,0.55) 45%, transparent 85%)" }} />
          <div className="absolute inset-0 opacity-[0.4] mix-blend-overlay" style={{
            backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, transparent 1px, transparent 2px)",
          }} />
        </div>

        <div className="relative z-10 px-5 sm:px-6 md:px-10 max-w-6xl mx-auto w-full pt-28 sm:pt-32 pb-10 sm:pb-14">
          <div className="max-w-2xl">
            {featured && (
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-sarrows-red mb-4 sm:mb-5 uppercase tracking-[0.15em] motion-safe:animate-fade-in">
                <span className="w-4 h-px bg-sarrows-red" />
                Now Streaming · {featured.type === "movie" ? "Movie" : "Anime"}
              </div>
            )}

            <h1
              className="font-black text-white mb-4 sm:mb-5 leading-[0.98] tracking-tight motion-safe:animate-slide-up"
              style={{ fontSize: "clamp(2.25rem, 7.5vw, 4.5rem)" }}
            >
              Every story.<br />
              <span className="text-gradient-red">Movies</span> &{" "}
              <span className="text-gradient">Anime</span>.
            </h1>

            <p className="text-base sm:text-lg text-gray-300 mb-8 sm:mb-9 leading-relaxed motion-safe:animate-fade-in max-w-xl">
              {featured?.description
                ? featured.description.slice(0, 140).trim() + (featured.description.length > 140 ? "…" : "")
                : "One home for the films and series you already love, and the next ones you haven't found yet."}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link href="/signup" className="btn-primary text-base px-8 py-3.5 w-full sm:w-auto">
                <Play className="w-5 h-5 fill-current" />
                Start Watching Free
              </Link>
              <Link href="/movies" className="btn-secondary text-base px-8 py-3.5 w-full sm:w-auto">
                <Info className="w-4 h-4" />
                Browse Library
              </Link>
            </div>

            {/* Hero stat pills */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-7 sm:mt-8">
              {[
                { label: "10,000+ titles" },
                { label: "HD quality" },
                { label: "Multi-language Dub & Sub", highlight: true },
                { label: "Free to start" },
              ].map((pill, i) => (
                <span
                  key={i}
                  className={`flex items-center gap-1.5 text-xs sm:text-sm ${pill.highlight ? "text-white font-semibold" : "text-gray-500"}`}
                >
                  {i > 0 && !pill.highlight && <span className="w-1 h-1 rounded-full bg-gray-700 flex-none" />}
                  {pill.highlight && (
                    <Globe className="w-3.5 h-3.5 text-sarrows-red flex-none" />
                  )}
                  {pill.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trending rail ───────────────────────────── */}
      {rail.length > 0 && (
        <section className="relative -mt-6 sm:-mt-8 pb-10 sm:pb-14 px-5 sm:px-6 md:px-10 max-w-6xl mx-auto">
          <ScrollReveal>
            <h2 className="section-title mb-4">In the library right now</h2>
            <TrendingRail items={rail} />
          </ScrollReveal>
        </section>
      )}

      {/* ── Multi-language feature strip ─────────────── */}
      <section className="py-12 sm:py-16 px-5 sm:px-6 md:px-10 max-w-6xl mx-auto">
        <ScrollReveal>
          <div
            className="rounded-3xl p-6 sm:p-8 md:p-10 relative overflow-hidden"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* Subtle red glow */}
            <div
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-40 rounded-full opacity-25 pointer-events-none"
              style={{ background: "radial-gradient(ellipse, rgba(229,9,20,0.6), transparent 70%)", filter: "blur(40px)" }}
            />

            <div className="relative">
              {/* Label */}
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-sarrows-red mb-3">
                <Globe className="w-3.5 h-3.5" /> Every Stream
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-2">
                Watch in your language.
              </h2>
              <p className="text-gray-400 text-sm sm:text-base mb-8 max-w-xl">
                Every stream on Sarrows ships with multiple audio dubs and subtitle tracks — so you can watch in the language you prefer, every time.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    icon: Mic,
                    title: "Multiple Audio Dubs",
                    desc: "Switch between original and dubbed audio tracks for your language of choice — available across all titles.",
                    color: "text-blue-400",
                    bg: "rgba(59,130,246,0.08)",
                    border: "rgba(59,130,246,0.15)",
                  },
                  {
                    icon: Subtitles,
                    title: "Rich Subtitles",
                    desc: "Full subtitle support with multiple language options. Toggle them on or off anytime during playback.",
                    color: "text-purple-400",
                    bg: "rgba(168,85,247,0.08)",
                    border: "rgba(168,85,247,0.15)",
                  },
                  {
                    icon: Globe,
                    title: "Global Coverage",
                    desc: "From English and Japanese to Spanish, French, Portuguese and more — we're expanding language support constantly.",
                    color: "text-emerald-400",
                    bg: "rgba(52,211,153,0.08)",
                    border: "rgba(52,211,153,0.15)",
                  },
                ].map((feat) => (
                  <div
                    key={feat.title}
                    className="rounded-2xl p-4 sm:p-5"
                    style={{ background: feat.bg, border: `1px solid ${feat.border}` }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: "rgba(0,0,0,0.25)" }}
                    >
                      <feat.icon className={`w-4.5 h-4.5 ${feat.color}`} style={{ width: "1.1rem", height: "1.1rem" }} />
                    </div>
                    <h3 className="text-white font-bold text-sm sm:text-base mb-1.5">{feat.title}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{feat.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Editorial split ──────────────────────────── */}
      <section className="py-10 sm:py-16 px-5 sm:px-6 md:px-10 max-w-6xl mx-auto">
        <ScrollReveal className="mb-10 sm:mb-14 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 sm:mb-4">One account. Everything you watch.</h2>
          <p className="text-gray-500 text-sm sm:text-base">
            Blockbusters and binge-worthy anime, side by side — no separate apps, no separate subscriptions.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <ScrollReveal>
            <Link
              href="/movies"
              className="group relative flex flex-col justify-end h-56 sm:h-64 rounded-2xl overflow-hidden p-6 sm:p-7"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="absolute inset-0 bg-sarrows-card" />
              {catalog.find((c) => c.type === "movie")?.bannerUrl && (
                <Image
                  src={catalog.find((c) => c.type === "movie")!.bannerUrl!}
                  alt=""
                  fill
                  sizes="600px"
                  className="object-cover opacity-40 group-hover:opacity-55 group-hover:scale-105 transition-all duration-500"
                />
              )}
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 30%, rgba(5,5,8,0.95) 100%)" }} />
              <div className="relative">
                <Film className="w-6 h-6 text-sarrows-red mb-3" />
                <h3 className="text-xl sm:text-2xl font-black text-white mb-1.5">Movies</h3>
                <p className="text-sm text-gray-400 mb-3">From new releases to timeless classics, in HD with multi-language dub & sub.</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-white group-hover:gap-2 transition-all">
                  Explore movies <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <Link
              href="/anime"
              className="group relative flex flex-col justify-end h-56 sm:h-64 rounded-2xl overflow-hidden p-6 sm:p-7"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="absolute inset-0 bg-sarrows-card" />
              {catalog.find((c) => c.type === "anime")?.bannerUrl && (
                <Image
                  src={catalog.find((c) => c.type === "anime")!.bannerUrl!}
                  alt=""
                  fill
                  sizes="600px"
                  className="object-cover opacity-40 group-hover:opacity-55 group-hover:scale-105 transition-all duration-500"
                />
              )}
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 30%, rgba(5,5,8,0.95) 100%)" }} />
              <div className="relative">
                <Tv className="w-6 h-6 text-sarrows-red mb-3" />
                <h3 className="text-xl sm:text-2xl font-black text-white mb-1.5">Anime</h3>
                <p className="text-sm text-gray-400 mb-3">Every season dubbed & subbed — from can't-miss hits to hidden gems.</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-white group-hover:gap-2 transition-all">
                  Explore anime <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────── */}
      <section className="py-14 sm:py-20 px-5 sm:px-6">
        <ScrollReveal className="max-w-4xl mx-auto">
          <div
            className="rounded-3xl p-8 sm:p-10 md:p-16 text-center relative overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="absolute inset-0 bg-sarrows-card" />
            {ctaBg && (
              <Image src={ctaBg} alt="" fill sizes="900px" className="object-cover opacity-25" />
            )}
            <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 0%, rgba(229,9,20,0.35), transparent 65%), linear-gradient(180deg, rgba(5,5,8,0.4), rgba(5,5,8,0.95))" }} />
            <div className="relative">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-sarrows-red mb-4">
                <Sparkles className="w-3.5 h-3.5" /> Free to Start
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-3 sm:mb-4">
                Ready to Start Watching?
              </h2>
              <p className="text-gray-400 mb-2 text-base sm:text-lg">
                Join thousands of viewers. Free to sign up, no credit card required.
              </p>
              <p className="text-gray-600 text-xs sm:text-sm mb-7 sm:mb-8 flex items-center justify-center gap-1.5">
                <Globe className="w-3.5 h-3.5 flex-none" />
                All streams available with multiple language dubs &amp; subtitles
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/signup" className="btn-primary text-base px-10 py-3.5 inline-flex">
                  <Play className="w-5 h-5 fill-current" />
                  Create Free Account
                </Link>
                <a
                  href="https://t.me/ClerXin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "#229ED9", boxShadow: "0 4px 20px rgba(34,158,217,0.35)" }}
                >
                  <Send className="w-5 h-5" />
                  Join Telegram
                </a>
              </div>
              <p className="text-gray-700 text-xs mt-5">
                By signing up you agree to our{" "}
                <Link href="/terms" className="text-gray-500 hover:text-gray-300 underline underline-offset-2 transition">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-gray-500 hover:text-gray-300 underline underline-offset-2 transition">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-8 px-5 sm:px-6" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto gap-4">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={24} />
            <span className="text-sm font-black text-white">SARROWS</span>
          </Link>
          <p className="text-gray-600 text-xs">© {new Date().getFullYear()} Sarrows. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <Link href="/terms" className="hover:text-gray-400 transition">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-400 transition">Privacy</Link>
            <Link href="/login" className="hover:text-gray-400 transition">Sign In</Link>
            <Link href="/signup" className="hover:text-gray-400 transition">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
