"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, Star, ChevronLeft, ChevronRight } from "lucide-react";

interface HeroSectionProps {
  items: any[];
}

export default function HeroSection({ items }: HeroSectionProps) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const go = useCallback(
    (next: number) => {
      if (animating) return;
      setAnimating(true);
      setTimeout(() => {
        setCurrent(next);
        setAnimating(false);
      }, 220);
    },
    [animating]
  );

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => go((current + 1) % items.length), 7000);
    return () => clearInterval(t);
  }, [items.length, current, go]);

  if (!items.length) {
    return (
      <div className="h-[55vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl glass flex items-center justify-center">
            <Play className="w-7 h-7 text-sarrows-red" />
          </div>
          <h2 className="text-xl font-bold text-white">Welcome to Sarrows</h2>
          <p className="text-gray-500 text-sm">Content coming soon</p>
        </div>
      </div>
    );
  }

  const item = items[current];
  const isMovie = !item.type || item.type === "movie";
  const href = isMovie ? `/movies/${item.slug}` : `/anime/${item.slug}`;

  return (
    /* Mobile: 58vh so content sits above bottom nav comfortably */
    <div className="relative h-[58vh] sm:h-[68vh] md:h-[85vh] overflow-hidden">

      {/* Background */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${animating ? "opacity-0" : "opacity-100"}`}>
        {item.bannerUrl || item.posterUrl ? (
          <Image
            src={item.bannerUrl || item.posterUrl}
            alt={item.title}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-sarrows-darker via-sarrows-dark to-sarrows-card" />
        )}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0 hero-gradient-bottom" />
      <div className="absolute inset-0 bg-gradient-to-t from-sarrows-dark via-transparent to-black/20" />

      {/* Content */}
      <div
        className={`relative z-10 h-full flex items-end transition-all duration-500 ${
          animating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        }`}
      >
        {/* Extra bottom padding on mobile so content clears the bottom nav */}
        <div className="px-4 sm:px-6 md:px-14 pb-8 sm:pb-10 md:pb-20 max-w-3xl w-full">

          {/* Type + Rating */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="glass-red px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold text-sarrows-red uppercase tracking-widest">
              {isMovie ? "Movie" : "Anime"}
            </span>
            {item.rating > 0 && (
              <span className="flex items-center gap-1 glass px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold text-yellow-400">
                <Star className="w-2.5 h-2.5 fill-current" />
                {item.rating.toFixed(1)}
              </span>
            )}
            {item.releaseYear && (
              <span className="text-gray-400 text-[10px] sm:text-xs font-medium">{item.releaseYear}</span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-white mb-2 sm:mb-3 leading-[1.05] tracking-tight drop-shadow-2xl line-clamp-2">
            {item.title}
          </h1>

          {/* Description — hide on very small screens */}
          {item.description && (
            <p className="hidden sm:block text-gray-300 text-sm md:text-base line-clamp-2 md:line-clamp-3 mb-5 max-w-xl leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Genres */}
          {item.genres?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4 sm:mb-5">
              {item.genres.slice(0, 3).map((g: any) => (
                <span key={g._id || g.name} className="glass px-2 py-0.5 rounded-full text-[10px] sm:text-xs text-gray-300">
                  {g.name}
                </span>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-2.5">
            <Link href={href} className="btn-primary text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3">
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
              Watch Now
            </Link>
            <Link href={href} className="btn-secondary text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3">
              <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              More Info
            </Link>
          </div>
        </div>
      </div>

      {/* Prev / Next — desktop only */}
      {items.length > 1 && (
        <>
          <button
            onClick={() => go((current - 1 + items.length) % items.length)}
            aria-label="Previous"
            className="hidden md:flex absolute left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 glass rounded-full items-center justify-center text-white hover:bg-white/15 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => go((current + 1) % items.length)}
            aria-label="Next"
            className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 glass rounded-full items-center justify-center text-white hover:bg-white/15 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots — visible on all sizes */}
          <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-14 z-20 flex items-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? "w-5 h-1.5 bg-sarrows-red" : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
