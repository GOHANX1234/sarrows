"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Play, Eye } from "lucide-react";
import { formatDuration, formatViews, cn } from "@/lib/utils";

interface ContentCardProps {
  item: any;
  type: "movie" | "series";
  className?: string;
}

export default function ContentCard({ item, type, className }: ContentCardProps) {
  const href = type === "movie" ? `/movies/${item.slug}` : `/anime/${item.slug}`;
  const year = item.releaseYear ?? null;

  return (
    <Link href={href} className={cn("group block h-full", className)}>
      <div className="relative overflow-hidden rounded-2xl glass-card card-hover flex flex-col h-full">
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden">
          {item.posterUrl ? (
            <Image
              src={item.posterUrl}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-108"
              style={{ transform: "scale(1)" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sarrows-card to-sarrows-darker flex items-center justify-center">
              <span className="text-4xl font-black text-white/10">{item.title?.[0]}</span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-sarrows-red flex items-center justify-center shadow-lg glow-red-sm transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <Play className="w-5 h-5 text-white fill-current ml-0.5" />
            </div>
          </div>

          {/* Top badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {type === "series" && item.status === "ongoing" && (
              <span className="badge text-[10px] font-bold px-2 py-0.5" style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80" }}>
                LIVE
              </span>
            )}
          </div>

          {/* Rating */}
          {item.rating > 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-1 glass px-1.5 py-0.5 rounded-lg">
              <Star className="w-2.5 h-2.5 text-yellow-400 fill-current" />
              <span className="text-[11px] text-white font-semibold">{item.rating.toFixed(1)}</span>
            </div>
          )}

          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Info */}
        <div className="p-3 flex-1 flex flex-col">
          <h3 className="text-white text-[13px] font-semibold truncate group-hover:text-sarrows-red transition-colors leading-tight">
            {item.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500 flex-wrap">
            {year && <span>{year}</span>}
            {item.duration && (
              <>
                <span className="text-gray-700">·</span>
                <span>{formatDuration(item.duration)}</span>
              </>
            )}
            {item.views > 0 && (
              <>
                <span className="text-gray-700">·</span>
                <span className="flex items-center gap-0.5">
                  <Eye className="w-2.5 h-2.5" />
                  {formatViews(item.views)}
                </span>
              </>
            )}
          </div>
          {item.genres?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.genres.slice(0, 2).map((g: any) => (
                <span key={g._id || g.name} className="text-[10px] text-gray-500 px-1.5 py-0.5 rounded-md" style={{ background: "rgba(255,255,255,0.05)" }}>
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
