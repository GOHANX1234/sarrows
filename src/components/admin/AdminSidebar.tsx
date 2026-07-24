"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Film, Users, Home, Inbox } from "lucide-react";
import LogoMark from "@/components/ui/LogoMark";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/content", label: "Content", icon: Film },
  { href: "/admin/requests", label: "Requests", icon: Inbox },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-full w-56 flex-col z-40"
        style={{
          background: "rgba(5,5,8,0.97)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(40px)",
        }}
      >
        <div
          className="flex items-center gap-2.5 px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <LogoMark size={28} />
          <div>
            <span className="text-sm font-black text-white">SARROWS</span>
            <div className="text-[10px] text-gray-600 font-medium uppercase tracking-wider">Admin</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {links.map((link) => {
            const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  active ? "text-sarrows-red" : "text-gray-500 hover:text-white"
                )}
                style={
                  active
                    ? { background: "rgba(229,9,20,0.1)", border: "1px solid rgba(229,9,20,0.2)" }
                    : {}
                }
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <Link
            href="/home"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:text-white hover:bg-white/5 transition-all"
          >
            <Home className="w-4 h-4" /> Back to Site
          </Link>
        </div>
      </aside>

      {/* ── Mobile top bar (logo + title only) ── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14"
        style={{
          background: "rgba(5,5,8,0.97)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(40px)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <LogoMark size={22} />
          <div>
            <span className="text-sm font-black text-white">SARROWS</span>
            <span className="ml-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500">Admin</span>
          </div>
        </div>
        <Link
          href="/home"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-gray-500 hover:text-white transition"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <Home className="w-3.5 h-3.5" /> Site
        </Link>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
        style={{
          background: "rgba(5,5,8,0.97)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(40px)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {links.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-all",
                active ? "text-sarrows-red" : "text-gray-600 hover:text-gray-300"
              )}
            >
              <link.icon
                className={cn("w-5 h-5 transition-all", active ? "text-sarrows-red" : "text-gray-600")}
              />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
