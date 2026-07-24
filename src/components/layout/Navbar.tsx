"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Search, User, LogOut, Settings, Bookmark, Home, Film, Tv, ChevronDown } from "lucide-react";
import LogoMark from "@/components/ui/LogoMark";
import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navLinks = [
    { href: "/home",   label: "Home",   icon: Home },
    { href: "/movies", label: "Movies", icon: Film },
    { href: "/anime",  label: "Anime",  icon: Tv   },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      {/* ── Top bar ────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "glass-navbar shadow-xl" : "bg-gradient-to-b from-black/70 to-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-4 md:px-8 h-14 sm:h-16 max-w-screen-2xl mx-auto">

          {/* Logo — always shows mark + wordmark */}
          <Link href="/home" className="flex items-center gap-2 flex-shrink-0 group">
            <LogoMark size={26} className="group-hover:scale-110 transition-transform duration-200" />
            <span className="text-base sm:text-lg font-black text-white tracking-tight">
              SARROWS
            </span>
          </Link>

          {/* Desktop centre nav */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(link.href)
                    ? "text-white bg-white/10"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.07]"
                }`}
              >
                <link.icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right — user or auth */}
          <div className="flex items-center gap-2">
            {session?.user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-label="Open user menu"
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-white/10 transition-all duration-200"
                >
                  {/* Avatar */}
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sarrows-red to-red-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {session.user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-white max-w-[90px] truncate">
                    {session.user.name}
                  </span>
                  <ChevronDown className={`hidden md:block w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-11 w-52 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in"
                    style={{ background: "#0e0e14", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}>
                    <div className="px-4 py-3 border-b border-white/[0.07]">
                      <p className="text-sm font-semibold text-white truncate">{session.user.name}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{session.user.email}</p>
                    </div>
                    <div className="py-1.5">
                      {[
                        { href: `/profile/${session.user.name}`, icon: User,     label: "Profile" },
                        { href: "/watchlist",                     icon: Bookmark, label: "My Watchlist" },
                        ...((session.user as any).role === "admin"
                          ? [{ href: "/admin", icon: Settings, label: "Admin Panel" }]
                          : []),
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                        >
                          <item.icon className="w-4 h-4 opacity-70" />
                          {item.label}
                        </Link>
                      ))}
                      <div className="my-1 mx-3 h-px bg-white/[0.06]" />
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Show on both mobile and desktop when logged out */
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="text-sm text-gray-300 hover:text-white transition px-3 py-1.5 rounded-xl hover:bg-white/[0.07]"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary text-xs sm:text-sm py-1.5 px-3 sm:px-4"
                >
                  Join Free
                </Link>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ── Bottom nav (all sizes) ─────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="glass-navbar border-t border-white/[0.06] px-1 py-1">
          <div className="flex items-center justify-around">

            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl transition-all duration-200 ${
                    active ? "text-sarrows-red" : "text-gray-500"
                  }`}
                >
                  <link.icon className={`w-5 h-5 transition-transform duration-200 ${active ? "scale-110" : ""}`} />
                  <span className={`text-[10px] font-semibold transition-colors ${active ? "text-sarrows-red" : "text-gray-500"}`}>
                    {link.label}
                  </span>
                </Link>
              );
            })}

            {/* Search */}
            <Link
              href="/search"
              className={`flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl transition-all duration-200 ${
                isActive("/search") ? "text-sarrows-red" : "text-gray-500"
              }`}
            >
              <Search className={`w-5 h-5 transition-transform duration-200 ${isActive("/search") ? "scale-110" : ""}`} />
              <span className={`text-[10px] font-semibold ${isActive("/search") ? "text-sarrows-red" : "text-gray-500"}`}>
                Search
              </span>
            </Link>

            {/* Profile / Sign in */}
            {session?.user ? (
              <Link
                href={`/profile/${session.user.name}`}
                className={`flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl transition-all duration-200 ${
                  pathname.startsWith("/profile") ? "text-sarrows-red" : "text-gray-500"
                }`}
              >
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-sarrows-red to-red-700 flex items-center justify-center">
                  <span className="text-white text-[9px] font-bold leading-none">
                    {session.user.name?.[0]?.toUpperCase()}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-gray-500">Profile</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl text-gray-500 transition-all duration-200"
              >
                <User className="w-5 h-5" />
                <span className="text-[10px] font-semibold">Sign In</span>
              </Link>
            )}

          </div>
        </div>
      </nav>
    </>
  );
}
