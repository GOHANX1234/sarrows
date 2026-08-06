"use client";

import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

// Keys that are not user-controlled filters (exclude from "active filters" check)
const NON_FILTER_KEYS = new Set(["page"]);

interface BrowseFiltersProps {
  genres: any[];
  currentParams: Record<string, string | undefined>;
  basePath: string;
  showStatus?: boolean;
}

const selectCls = "text-sm text-white rounded-xl px-3 py-2 outline-none transition-all cursor-pointer flex-none";
const selectStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const sortOptions = [
  { value: "latest",  label: "Latest"       },
  { value: "views",   label: "Most Watched"  },
  { value: "rating",  label: "Top Rated"     },
  { value: "year",    label: "By Year"       },
];

const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

export default function BrowseFilters({ genres, currentParams, basePath, showStatus }: BrowseFiltersProps) {
  const router = useRouter();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams();
    Object.entries(currentParams).forEach(([k, v]) => { if (v && k !== "page") params.set(k, v); });
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.push(`${basePath}?${params.toString()}`);
  };

  const clearAll = () => router.push(basePath);

  const hasFilters = Object.entries(currentParams).some(([k, v]) => v && !NON_FILTER_KEYS.has(k));

  return (
    <div className="mb-7 space-y-2">
      {/* Row — horizontally scrollable on mobile */}
      <div
        className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {/* Label */}
        <span className="flex items-center gap-1 text-gray-600 text-xs font-medium flex-none">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Filter
        </span>

        <select
          value={currentParams.genre || ""}
          onChange={(e) => update("genre", e.target.value)}
          className={selectCls}
          style={selectStyle}
        >
          <option value="">All Genres</option>
          {genres.map((g) => <option key={g._id} value={g.name}>{g.name}</option>)}
        </select>

        <select
          value={currentParams.year || ""}
          onChange={(e) => update("year", e.target.value)}
          className={selectCls}
          style={selectStyle}
        >
          <option value="">All Years</option>
          {years.map((y) => <option key={y} value={y.toString()}>{y}</option>)}
        </select>

        <select
          value={currentParams.sort || "latest"}
          onChange={(e) => update("sort", e.target.value)}
          className={selectCls}
          style={selectStyle}
        >
          {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {showStatus && (
          <select
            value={currentParams.status || ""}
            onChange={(e) => update("status", e.target.value)}
            className={selectCls}
            style={selectStyle}
          >
            <option value="">All Status</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        )}

        {/* Clear pill */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-sarrows-red flex-none px-3 py-2 rounded-xl transition-all hover:bg-sarrows-red/10"
            style={{ border: "1px solid rgba(229,9,20,0.3)" }}
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5">
          {currentParams.genre && (
            <span className="text-xs px-2.5 py-1 rounded-full text-sarrows-red font-medium"
              style={{ background: "rgba(229,9,20,0.1)", border: "1px solid rgba(229,9,20,0.2)" }}>
              Genre: {currentParams.genre}
            </span>
          )}
          {currentParams.year && (
            <span className="text-xs px-2.5 py-1 rounded-full text-blue-400 font-medium"
              style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
              Year: {currentParams.year}
            </span>
          )}
          {currentParams.status && (
            <span className="text-xs px-2.5 py-1 rounded-full text-green-400 font-medium"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              {currentParams.status}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
