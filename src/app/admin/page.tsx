export const dynamic = "force-dynamic";

import Link from "next/link";
import { connectDB } from "@/lib/db";
import Movie from "@/models/Movie";
import Series from "@/models/Series";
import User from "@/models/User";
import Request from "@/models/Request";
import { Film, Tv, Users, Plus, Settings, UserCheck, Inbox } from "lucide-react";

async function getStats() {
  await connectDB();
  const [totalMovies, totalSeries, totalUsers, publishedMovies, publishedSeries, pendingRequests] = await Promise.all([
    Movie.countDocuments(),
    Series.countDocuments(),
    User.countDocuments(),
    Movie.countDocuments({ status: "published" }),
    Series.countDocuments({ publishStatus: "published" }),
    Request.countDocuments({ status: "pending" }),
  ]);
  return { totalMovies, totalSeries, totalUsers, publishedMovies, publishedSeries, pendingRequests };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    {
      label: "Movies",
      value: stats.totalMovies,
      sub: `${stats.publishedMovies} published`,
      icon: Film,
      color: "text-blue-400",
      bg: "rgba(59,130,246,0.08)",
      border: "rgba(59,130,246,0.18)",
    },
    {
      label: "Anime",
      value: stats.totalSeries,
      sub: `${stats.publishedSeries} published`,
      icon: Tv,
      color: "text-purple-400",
      bg: "rgba(168,85,247,0.08)",
      border: "rgba(168,85,247,0.18)",
    },
    {
      label: "Users",
      value: stats.totalUsers,
      sub: "registered",
      icon: Users,
      color: "text-emerald-400",
      bg: "rgba(52,211,153,0.08)",
      border: "rgba(52,211,153,0.18)",
    },
    {
      label: "Requests",
      value: stats.pendingRequests,
      sub: "pending",
      icon: Inbox,
      color: "text-yellow-400",
      bg: "rgba(234,179,8,0.08)",
      border: "rgba(234,179,8,0.18)",
    },
  ];

  const actions = [
    { href: "/admin/content?tab=add-movie", label: "Add Movie", icon: Plus, desc: "New movie entry" },
    { href: "/admin/content?tab=add-anime", label: "Add Anime", icon: Plus, desc: "New anime series" },
    { href: "/admin/content", label: "Manage Content", icon: Settings, desc: "Edit & publish" },
    { href: "/admin/requests", label: "View Requests", icon: Inbox, desc: "User content requests" },
    { href: "/admin/users", label: "Manage Users", icon: UserCheck, desc: "Roles & accounts" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 pt-2">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Platform overview</p>
      </div>

      {/* Stats — 2×2 on mobile, 4-col on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: c.bg, border: `1px solid ${c.border}` }}
          >
            {/* Icon + label row */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{c.label}</span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-none"
                style={{ background: "rgba(0,0,0,0.3)" }}
              >
                <c.icon className={`w-3.5 h-3.5 ${c.color}`} />
              </div>
            </div>
            {/* Value */}
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white leading-none">{c.value}</p>
              <p className="text-[11px] text-gray-500 mt-1">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions — 2-col on all sizes */}
      <div
        className="rounded-2xl p-4 sm:p-5"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all duration-200 hover:bg-white/[0.07]"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-none"
                style={{ background: "rgba(229,9,20,0.12)", border: "1px solid rgba(229,9,20,0.2)" }}
              >
                <a.icon className="w-3.5 h-3.5 text-sarrows-red" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold leading-tight group-hover:text-sarrows-red transition-colors">
                  {a.label}
                </p>
                <p className="text-gray-600 text-[10px] mt-0.5 truncate">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
