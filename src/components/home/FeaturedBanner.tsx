"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Info, Star, Check, Plus } from "lucide-react";
import { useState } from "react";

interface FeaturedBannerProps {
  item: any;
}

export default function FeaturedBanner({ item }: FeaturedBannerProps) {
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);

  if (!item) return null;

  const isMovie = !item.type || item.type === "movie";
  const href = isMovie
    ? `/movies/${item.slug}`
    : item.type === "series"
    ? `/series/${item.slug}`
    : `/anime/${item.slug}`;

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loadingWatchlist) return;
    setLoadingWatchlist(true);
    try {
      const res = await fetch("/api/watchlist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: isMovie ? "Movie" : "Series",
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
    <section className="relative rounded-3xl overflow-hidden glass-card border border-white/10 my-8 shadow-2xl">
      {/* Background Image */}
      <div className="absolute inset-0">
        {item.bannerUrl || item.posterUrl ? (
          <Image
            src={item.bannerUrl || item.posterUrl}
            alt={item.title}
            fill
            className="object-cover object-center brightness-75 scale-105"
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-red-900/50 via-purple-900/40 to-black" />
        )}
        {/* Dynamic Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-sarrows-dark via-transparent to-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-10 md:p-12 max-w-2xl">
        {/* Tag */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 bg-sarrows-red text-white text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg">
            SPOTLIGHT CHOICE
          </span>
          {item.rating > 0 && (
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-xs font-bold text-yellow-400 border border-white/10">
              <Star className="w-3 h-3 fill-current" />
              {item.rating.toFixed(1)} Rating
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-3 tracking-tight leading-tight drop-shadow-lg">
          {item.title}
        </h2>

        {/* Description */}
        {item.description && (
          <p className="text-gray-300 text-xs sm:text-sm md:text-base line-clamp-2 sm:line-clamp-3 mb-6 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={href}
            className="btn-primary text-xs sm:text-sm px-6 py-3 font-bold shadow-xl shadow-red-600/30 flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            Watch Now
          </Link>

          <button
            onClick={toggleWatchlist}
            disabled={loadingWatchlist}
            className={`btn-secondary text-xs sm:text-sm px-4 py-3 font-semibold flex items-center gap-2 transition-all ${
              inWatchlist ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : ""
            }`}
          >
            {inWatchlist ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                In Watchlist
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add to Watchlist
              </>
            )}
          </button>

          <Link
            href={href}
            className="btn-secondary text-xs sm:text-sm px-4 py-3 font-semibold flex items-center gap-2"
          >
            <Info className="w-4 h-4" />
            More Details
          </Link>
        </div>
      </div>
    </section>
  );
}
