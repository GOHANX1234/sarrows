"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Play, Eye, Plus, Check } from "lucide-react";
import { formatDuration, formatViews, cn } from "@/lib/utils";
import { useState } from "react";

interface ContentCardProps {
  item: any;
  type: "movie" | "series";
  className?: string;
  rank?: number;
}

export default function ContentCard({ item, type, className, rank }: ContentCardProps) {
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);

  const href =
    type === "movie"
      ? `/movies/${item.slug}`
      : item.type === "series"
      ? `/series/${item.slug}`
      : `/anime/${item.slug}`;
  const year = item.releaseYear ?? null;

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loadingWatchlist) return;
    setLoadingWatchlist(true);
    try {
      const res = await fetch("/api/watchlist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: type === "movie" ? "Movie" : "Series",
          targetId: item._id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setInWatchlist(data.added);
      }
    } catch (err) {
      console.error("Watchlist error:", err);
    } finally {
      setLoadingWatchlist(false);
    }
  };

  return (
    <Link href={href} className={cn("group block h-full select-none", className)}>
      <div className="relative overflow-hidden rounded-xl glass-card border border-white/10 flex flex-col h-full transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-2xl group-hover:shadow-red-950/20 group-hover:border-sarrows-red/40 bg-gradient-to-b from-white/[0.04] to-black/40">

        {/* Poster Container */}
        <div className="relative aspect-[2/3] overflow-hidden bg-zinc-900 rounded-t-xl">
          {item.posterUrl ? (
            <Image
              src={item.posterUrl}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 35vw, (max-width: 1024px) 22vw, 15vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sarrows-card to-zinc-900 flex items-center justify-center p-2 text-center">
              <span className="text-xs font-bold text-white/40">{item.title}</span>
            </div>
          )}

          {/* Hover Overlay with Action Buttons */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-1.5 p-2 z-10">
            <div className="w-9 h-9 rounded-full bg-sarrows-red text-white flex items-center justify-center shadow-lg glow-red-sm transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>

            <button
              onClick={toggleWatchlist}
              disabled={loadingWatchlist}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-md transition-all shadow-md ${
                inWatchlist
                  ? "bg-emerald-500 text-white"
                  : "bg-white/20 hover:bg-white/30 text-white border border-white/30"
              }`}
            >
              {inWatchlist ? (
                <>
                  <Check className="w-2.5 h-2.5" />
                  Saved
                </>
              ) : (
                <>
                  <Plus className="w-2.5 h-2.5" />
                  Watchlist
                </>
              )}
            </button>
          </div>

          {/* Top Badges */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10">
            {rank && (
              <span className="bg-sarrows-red text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow">
                #{rank}
              </span>
            )}
            {type === "series" && item.status === "ongoing" && (
              <span className="bg-emerald-500/80 backdrop-blur-md text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                LIVE
              </span>
            )}
          </div>

          {/* Rating Badge */}
          {item.rating > 0 && (
            <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-yellow-400 font-bold text-[10px] border border-white/10 z-10">
              <Star className="w-2.5 h-2.5 fill-current" />
              <span>{item.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-white text-xs font-bold truncate group-hover:text-sarrows-red transition-colors leading-snug">
              {item.title}
            </h3>

            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-400 flex-wrap">
              {year && <span>{year}</span>}
              {item.duration && (
                <>
                  <span className="text-gray-600 font-bold">&bull;</span>
                  <span>{formatDuration(item.duration)}</span>
                </>
              )}
              {item.views > 0 && (
                <>
                  <span className="text-gray-600 font-bold">&bull;</span>
                  <span className="flex items-center gap-0.5 text-gray-400">
                    <Eye className="w-2.5 h-2.5" />
                    {formatViews(item.views)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Genres */}
          {item.genres?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {item.genres.slice(0, 1).map((g: any) => (
                <span
                  key={g._id || g.name}
                  className="text-[9px] text-gray-400 bg-white/[0.06] border border-white/5 px-1.5 py-0.2 rounded"
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}
        </div>

      </div>
    </Link>
  );
}
