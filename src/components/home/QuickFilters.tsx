"use client";

import { LayoutGrid, Flame, Film, Tv, Monitor, Star } from "lucide-react";

interface QuickFiltersProps {
  activeFilter: string;
  onSelect: (filter: string) => void;
}

const FILTERS = [
  { id: "all", label: "All Content", icon: LayoutGrid },
  { id: "trending", label: "Trending", icon: Flame },
  { id: "movies", label: "Movies", icon: Film },
  { id: "anime", label: "Anime", icon: Tv },
  { id: "series", label: "Web Series", icon: Monitor },
  { id: "top-rated", label: "Top Rated", icon: Star },
];

export default function QuickFilters({ activeFilter, onSelect }: QuickFiltersProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none max-w-full">
      {FILTERS.map((f) => {
        const Icon = f.icon;
        const active = activeFilter === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 border ${
              active
                ? "bg-sarrows-red text-white border-sarrows-red shadow-lg shadow-red-500/30 scale-105"
                : "bg-white/[0.06] hover:bg-white/[0.12] text-gray-300 border-white/10 hover:border-white/20"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${active ? "text-white" : "text-gray-400"}`} />
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
