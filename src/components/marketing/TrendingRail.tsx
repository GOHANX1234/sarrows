"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

interface Item {
  title: string;
  slug: string;
  posterUrl: string;
  type: "movie" | "anime";
  releaseYear?: number | null;
}

interface Props {
  items: Item[];
}

/**
 * A horizontally-scrolling row of real catalog posters, the way an actual
 * streaming service browses its library — used on the landing page so
 * visitors see the real catalog instead of stock marketing copy.
 */
export default function TrendingRail({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-5 px-5 sm:-mx-6 sm:px-6 md:-mx-10 md:px-10 scrollbar-hide snap-x snap-mandatory">
      {items.map((item, i) => (
        <Link
          key={`${item.slug}-${i}`}
          href={item.type === "movie" ? `/movies/${item.slug}` : `/anime/${item.slug}`}
          className="group relative flex-none w-[130px] sm:w-[160px] md:w-[190px] aspect-[2/3] rounded-xl overflow-hidden snap-start"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {item.posterUrl ? (
            <Image
              src={item.posterUrl}
              alt={item.title}
              fill
              sizes="190px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-sarrows-card" />
          )}
          <div
            className="absolute inset-0 opacity-70 group-hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.92) 100%)" }}
          />
          <div className="absolute bottom-0 inset-x-0 p-3">
            <span className="badge bg-sarrows-red/90 text-white text-[10px] font-semibold mb-1.5 uppercase tracking-wide">
              {item.type === "movie" ? "Movie" : "Anime"}
            </span>
            <p className="text-sm font-bold text-white leading-snug line-clamp-2">{item.title}</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Play className="w-4 h-4 text-white fill-current" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
