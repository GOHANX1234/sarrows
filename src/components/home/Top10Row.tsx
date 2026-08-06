"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, Play, Flame } from "lucide-react";

interface Top10RowProps {
  items: any[];
  title?: string;
}

export default function Top10Row({ items, title = "Top 10 Trending Today" }: Top10RowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = rowRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const cardW = card ? card.offsetWidth + 16 : 220;
    el.scrollBy({ left: dir === "right" ? cardW * 2.5 : -cardW * 2.5, behavior: "smooth" });
  };

  if (!items || items.length === 0) return null;

  const displayItems = items.slice(0, 10);

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sarrows-red to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Flame className="w-4 h-4 text-white fill-current" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              {title}
            </h2>
            <p className="text-xs text-gray-400 font-normal hidden sm:block">
              Most watched movies & series this week
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className="w-8 h-8 rounded-xl glass flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/15 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className="w-8 h-8 rounded-xl glass flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/15 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Rail */}
      <div
        ref={rowRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {displayItems.map((item, idx) => {
          const rank = idx + 1;
          const isMovie = !item.type || item.type === "movie";
          const href = isMovie
            ? `/movies/${item.slug}`
            : item.type === "series"
            ? `/series/${item.slug}`
            : `/anime/${item.slug}`;

          return (
            <div
              key={item._id}
              data-card
              className="flex-none flex items-end group cursor-pointer relative"
              style={{ scrollSnapAlign: "start" }}
            >
              <Link href={href} className="flex items-end group/card">
                {/* Giant Stylized Rank Number */}
                <div className="relative -mr-4 sm:-mr-6 z-0 select-none pointer-events-none flex-shrink-0">
                  <span
                    className="text-[75px] sm:text-[100px] md:text-[115px] font-black leading-none tracking-tighter"
                    style={{
                      WebkitTextStroke: "2px rgba(255, 255, 255, 0.25)",
                      color: "transparent",
                      backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.02) 100%)",
                      WebkitBackgroundClip: "text",
                      textShadow: "0 10px 30px rgba(0,0,0,0.8)",
                      fontFamily: "system-ui, sans-serif",
                    }}
                  >
                    {rank}
                  </span>
                </div>

                {/* Poster Card */}
                <div className="relative w-[108px] sm:w-[130px] md:w-[145px] aspect-[2/3] rounded-xl overflow-hidden glass-card shadow-2xl transition-all duration-300 group-hover/card:scale-105 group-hover/card:shadow-red-900/30 group-hover/card:border-sarrows-red/50 border border-white/10 z-10">
                  {item.posterUrl ? (
                    <Image
                      src={item.posterUrl}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover/card:scale-110"
                      sizes="(max-width: 640px) 130px, 180px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center p-2 text-center">
                      <span className="text-xs font-bold text-gray-400">{item.title}</span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover/card:opacity-90 transition-opacity" />

                  {/* Top Rank Badge */}
                  <div className="absolute top-2 left-2 z-20">
                    <span className="bg-sarrows-red/90 backdrop-blur-md text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-md uppercase tracking-wider border border-white/20">
                      TOP {rank}
                    </span>
                  </div>

                  {/* Rating Badge */}
                  {item.rating > 0 && (
                    <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[10px] text-yellow-400 font-bold border border-white/10">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      {item.rating.toFixed(1)}
                    </div>
                  )}

                  {/* Hover Play Button */}
                  <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-300">
                    <div className="w-11 h-11 rounded-full bg-sarrows-red text-white flex items-center justify-center shadow-xl transform scale-75 group-hover/card:scale-100 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Title & Info at Bottom */}
                  <div className="absolute bottom-0 inset-x-0 p-2.5 z-20">
                    <p className="text-xs font-bold text-white line-clamp-1 group-hover/card:text-sarrows-red transition-colors">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-300 font-medium">
                      <span>{isMovie ? "Movie" : "Series"}</span>
                      {item.releaseYear && (
                        <>
                          <span>&bull;</span>
                          <span>{item.releaseYear}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
