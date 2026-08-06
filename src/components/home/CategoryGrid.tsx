"use client";

import Link from "next/link";
import { ArrowUpRight, Compass, Flame, Film, Tv, Zap, Ghost, HeartHandshake, Clapperboard, Sword } from "lucide-react";

interface CategoryTile {
  name: string;
  href: string;
  icon: any;
  gradient: string;
  border: string;
  count?: string;
}

const CATEGORIES: CategoryTile[] = [
  {
    name: "Action & Adventure",
    href: "/movies?genre=Action",
    icon: Sword,
    gradient: "from-red-600/30 via-orange-600/20 to-black/60",
    border: "border-red-500/30 hover:border-red-500/60",
    count: "Explosive Releases",
  },
  {
    name: "Anime & Animation",
    href: "/anime",
    icon: Tv,
    gradient: "from-purple-600/30 via-pink-600/20 to-black/60",
    border: "border-purple-500/30 hover:border-purple-500/60",
    count: "Sub & Dubbed Series",
  },
  {
    name: "Sci-Fi & Fantasy",
    href: "/movies?genre=Sci-Fi",
    icon: Zap,
    gradient: "from-blue-600/30 via-cyan-600/20 to-black/60",
    border: "border-cyan-500/30 hover:border-cyan-500/60",
    count: "Next-Gen Cinema",
  },
  {
    name: "Thriller & Mystery",
    href: "/movies?genre=Thriller",
    icon: Ghost,
    gradient: "from-emerald-600/30 via-teal-600/20 to-black/60",
    border: "border-emerald-500/30 hover:border-emerald-500/60",
    count: "Edge of Your Seat",
  },
  {
    name: "Trending Web Series",
    href: "/series",
    icon: Clapperboard,
    gradient: "from-amber-600/30 via-yellow-600/20 to-black/60",
    border: "border-amber-500/30 hover:border-amber-500/60",
    count: "Binge-Worthy Shows",
  },
  {
    name: "Romance & Comedy",
    href: "/movies?genre=Romance",
    icon: HeartHandshake,
    gradient: "from-rose-600/30 via-pink-500/20 to-black/60",
    border: "border-rose-500/30 hover:border-rose-500/60",
    count: "Feel Good Hits",
  },
];

export default function CategoryGrid() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-sarrows-red" />
          <h2 className="text-base sm:text-xl font-bold text-white tracking-tight">
            Explore Categories
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.name}
              href={cat.href}
              className={`group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${cat.gradient} border ${cat.border} backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98] flex flex-col justify-between min-h-[110px]`}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white/70 transition-colors" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-sarrows-red transition-colors leading-tight">
                  {cat.name}
                </h3>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5 truncate">
                  {cat.count}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
