"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, Star, ChevronLeft, ChevronRight, Plus, Check, Volume2, VolumeX } from "lucide-react";

interface HeroSectionProps {
  items: any[];
}

export default function HeroSection({ items }: HeroSectionProps) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [inWatchlist, setInWatchlist] = useState<Record<string, boolean>>({});
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (next: number) => {
      if (animating) return;
      setAnimating(true);
      setTimeout(() => {
        setCurrent(next);
        setAnimating(false);
      }, 250);
    },
    [animating]
  );

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => go((current + 1) % items.length), 7500);
    return () => clearInterval(t);
  }, [items.length, current, go]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        go((current + 1) % items.length);
      } else {
        go((current - 1 + items.length) % items.length);
      }
    }
    touchStartX.current = null;
  };

  const toggleWatchlist = async (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    e.stopPropagation();
    const isMovie = !item.type || item.type === "movie";
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
        setInWatchlist((prev) => ({ ...prev, [item._id]: data.added }));
      }
    } catch (err) {
      console.error("Watchlist error:", err);
    }
  };

  if (!items.length) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3 p-6 glass rounded-3xl border border-white/10 max-w-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-sarrows-red/20 border border-sarrows-red/40 flex items-center justify-center">
            <Play className="w-6 h-6 text-sarrows-red fill-current" />
          </div>
          <h2 className="text-xl font-bold text-white">Welcome to Sarrows</h2>
          <p className="text-gray-400 text-xs">Discover trending movies, anime, and web series.</p>
        </div>
      </div>
    );
  }

  const item = items[current];
  const isMovie = !item.type || item.type === "movie";
  const href = isMovie
    ? `/movies/${item.slug}`
    : item.type === "series"
    ? `/series/${item.slug}`
    : `/anime/${item.slug}`;
  const isAdded = !!inWatchlist[item._id];

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative h-[62vh] sm:h-[72vh] md:h-[88vh] overflow-hidden select-none group"
    >
      {/* Background Image with Ken-Burns Motion */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
          animating ? "opacity-0 scale-105" : "opacity-100 scale-100"
        }`}
      >
        {item.bannerUrl || item.posterUrl ? (
          <Image
            src={item.bannerUrl || item.posterUrl}
            alt={item.title}
            fill
            priority
            className="object-cover object-center transition-transform duration-10000 ease-out"
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-sarrows-darker via-zinc-900 to-sarrows-card" />
        )}
      </div>

      {/* Cinematic Gradient Vignette Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-sarrows-dark via-sarrows-dark/40 to-black/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-sarrows-dark via-sarrows-dark/70 to-transparent" />
      <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/30 to-black/70 pointer-events-none" />

      {/* Content Container */}
      <div
        className={`relative z-10 h-full flex items-end transition-all duration-500 ${
          animating ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
        }`}
      >
        <div className="px-4 sm:px-8 md:px-14 pb-12 sm:pb-16 md:pb-20 max-w-3xl w-full">

          {/* Badges & Quality Indicators */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="bg-sarrows-red text-white text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-lg shadow-red-600/30">
              {isMovie ? "MOVIE" : item.type === "anime" ? "ANIME" : "WEB SERIES"}
            </span>

            {item.rating > 0 && (
              <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold text-yellow-400 border border-white/10">
                <Star className="w-3 h-3 fill-current" />
                {item.rating.toFixed(1)}
              </span>
            )}

            {item.releaseYear && (
              <span className="text-gray-300 text-[10px] sm:text-xs font-semibold bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-md">
                {item.releaseYear}
              </span>
            )}
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-white mb-2 sm:mb-3 leading-[1.05] tracking-tight drop-shadow-2xl line-clamp-2">
            {item.title}
          </h1>

          {/* Genres */}
          {item.genres?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 sm:mb-4">
              {item.genres.slice(0, 3).map((g: any) => (
                <span
                  key={g._id || g.name}
                  className="bg-black/40 backdrop-blur-md border border-white/10 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs text-gray-200 font-medium"
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {item.description && (
            <p className="hidden sm:block text-gray-300 text-xs sm:text-sm md:text-base line-clamp-2 md:line-clamp-3 mb-6 max-w-xl leading-relaxed drop-shadow">
              {item.description}
            </p>
          )}

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href={href}
              className="btn-primary text-xs sm:text-sm px-6 py-3 font-bold shadow-xl shadow-red-600/30 flex items-center gap-2 transform active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              Watch Now
            </Link>

            <button
              onClick={(e) => toggleWatchlist(e, item)}
              className={`btn-secondary text-xs sm:text-sm px-4 py-3 font-semibold flex items-center gap-2 transition-all ${
                isAdded ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : ""
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  In List
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Watchlist
                </>
              )}
            </button>

            <Link
              href={href}
              className="btn-secondary text-xs sm:text-sm px-4 py-3 font-semibold flex items-center gap-2"
            >
              <Info className="w-4 h-4" />
              More Info
            </Link>
          </div>

        </div>
      </div>

      {/* Desktop Carousel Arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={() => go((current - 1 + items.length) % items.length)}
            aria-label="Previous Slide"
            className="hidden md:flex absolute left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-black/40 backdrop-blur-md rounded-full items-center justify-center text-white border border-white/10 hover:bg-white/20 hover:scale-110 transition-all shadow-xl"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => go((current + 1) % items.length)}
            aria-label="Next Slide"
            className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-black/40 backdrop-blur-md rounded-full items-center justify-center text-white border border-white/10 hover:bg-white/20 hover:scale-110 transition-all shadow-xl"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Bottom Progress Timer & Dots */}
          <div className="absolute bottom-3 sm:bottom-6 right-4 sm:right-8 md:right-14 z-20 flex items-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`relative overflow-hidden rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-8 h-2 bg-sarrows-red shadow-lg shadow-red-500/50"
                    : "w-2 h-2 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
