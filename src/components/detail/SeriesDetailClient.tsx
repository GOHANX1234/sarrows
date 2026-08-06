"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Star, Eye, Play, Tv, ChevronDown, ChevronUp } from "lucide-react";
import ReviewSection from "@/components/reviews/ReviewSection";
import WatchlistButton from "@/components/ui/WatchlistButton";
import CastGrid from "@/components/detail/CastGrid";
import { formatViews } from "@/lib/utils";

interface Props {
  series: any;
  episodes: any[];
  reviews: any[];
  userId?: string;
  userRole?: string;
}

export default function SeriesDetailClient({ series, episodes, reviews, userId }: Props) {
  const seasons  = Array.from(new Set(episodes.map((e) => e.season))).sort((a, b) => a - b);
  const [selectedSeason, setSelectedSeason] = useState(() => seasons[0] ?? 1);
  const [showAllEps, setShowAllEps] = useState(false);
  const filtered = episodes.filter((e) => e.season === selectedSeason);
  const displayed = showAllEps ? filtered : filtered.slice(0, 12);

  return (
    <div className="min-h-screen">

      {/* Banner */}
      <div className="relative h-52 sm:h-72 md:h-[420px] overflow-hidden">
        {series.bannerUrl || series.posterUrl ? (
          <Image
            src={series.bannerUrl || series.posterUrl}
            alt={series.title}
            fill
            className="object-cover object-top"
            priority
          />
        ) : (
          <div className="w-full h-full" style={{ background: "linear-gradient(135deg,#111118 0%,#0a0a0f 100%)" }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-sarrows-dark via-sarrows-dark/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-sarrows-dark/70 to-transparent" />
      </div>

      {/* Main content */}
      <div className="px-4 sm:px-6 md:px-10 lg:px-16 max-w-7xl mx-auto -mt-28 sm:-mt-36 md:-mt-52 relative z-10 pb-12">

        <div className="flex flex-col sm:flex-row gap-5 sm:gap-7 md:gap-10">

          {/* Poster */}
          <div className="flex-none w-28 sm:w-40 md:w-52 mx-auto sm:mx-0">
            {series.posterUrl ? (
              <Image
                src={series.posterUrl}
                alt={series.title}
                width={208}
                height={312}
                className="rounded-xl sm:rounded-2xl shadow-2xl object-cover w-full"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              />
            ) : (
              <div className="w-full aspect-[2/3] rounded-xl sm:rounded-2xl glass flex items-center justify-center">
                <Tv className="w-8 h-8 text-gray-700" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 sm:pt-16 md:pt-24 min-w-0">

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-2.5">
              <span className="glass-red px-2.5 py-0.5 rounded-full text-[10px] font-bold text-sarrows-red uppercase tracking-wider">
                {series.type === "anime" ? "Anime" : "Series"}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${series.status === "ongoing" ? "text-green-400" : "text-gray-400"}`}
                style={series.status === "ongoing"
                  ? { background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)" }
                  : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {series.status === "ongoing" ? "Ongoing" : "Completed"}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-3xl md:text-5xl font-black text-white mb-3 leading-tight">
              {series.title}
            </h1>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-4 text-sm">
              {series.rating > 0 && (
                <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
                  <Star className="w-4 h-4 fill-current" /> {series.rating.toFixed(1)}
                </div>
              )}
              {episodes.length > 0 && (
                <span className="text-gray-400 text-xs">{episodes.length} episodes</span>
              )}
              {series.views > 0 && (
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <Eye className="w-3.5 h-3.5" /> {formatViews(series.views)}
                </div>
              )}
            </div>

            {/* Genres */}
            {series.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {series.genres.map((g: any) => (
                  <span key={g._id} className="glass px-2.5 py-0.5 rounded-full text-xs text-gray-300">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {series.description && (
              <p className="text-gray-400 leading-relaxed mb-5 max-w-2xl text-sm">
                {series.description}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {episodes.length > 0 ? (
                <Link
                  href={`/anime/${series.slug}/episode/${episodes[0]?._id}`}
                  className="btn-primary text-sm px-5 py-2.5"
                >
                  <Play className="w-4 h-4 fill-current" /> Watch Now
                </Link>
              ) : (
                <span className="text-gray-600 text-sm italic">No episodes yet</span>
              )}
              {userId && <WatchlistButton targetType="Series" targetId={series._id} userId={userId} />}
            </div>
          </div>
        </div>

        {/* Episodes */}
        {episodes.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="section-title">Episodes</h2>

              {/* Season tabs — scrollable on mobile */}
              {seasons.length > 1 && (
                <div
                  className="flex items-center gap-1.5 overflow-x-auto pb-0.5"
                  style={{ scrollbarWidth: "none" } as React.CSSProperties}
                >
                  {seasons.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSelectedSeason(s); setShowAllEps(false); }}
                      className={`flex-none text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all ${
                        selectedSeason === s
                          ? "text-sarrows-red"
                          : "text-gray-500 hover:text-white hover:bg-white/[0.07]"
                      }`}
                      style={selectedSeason === s
                        ? { background: "rgba(229,9,20,0.1)", border: "1px solid rgba(229,9,20,0.2)" }
                        : {}}
                    >
                      S{s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Episode grid — 1 col on mobile, 2 on sm, 3 on lg */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {displayed.map((ep) => (
                <Link
                  key={ep._id}
                  href={`/anime/${series.slug}/episode/${ep._id}`}
                  className="flex items-center gap-3 rounded-xl p-3 hover:bg-white/[0.06] transition-all duration-200 group"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-none"
                    style={{ background: "rgba(229,9,20,0.12)", border: "1px solid rgba(229,9,20,0.2)" }}
                  >
                    <span className="text-[11px] font-black text-sarrows-red leading-none">{ep.episodeNumber}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-300 truncate group-hover:text-white transition">
                      {ep.title || `Episode ${ep.episodeNumber}`}
                    </p>
                    {ep.duration && (
                      <p className="text-[11px] text-gray-600 mt-0.5">{ep.duration} min</p>
                    )}
                  </div>
                  <Play className="w-3.5 h-3.5 text-gray-700 group-hover:text-sarrows-red transition flex-none" />
                </Link>
              ))}
            </div>

            {filtered.length > 12 && (
              <button
                onClick={() => setShowAllEps(!showAllEps)}
                className="mt-4 flex items-center gap-2 glass px-5 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white transition-all mx-auto"
              >
                {showAllEps
                  ? <><ChevronUp className="w-4 h-4" /> Show less</>
                  : <><ChevronDown className="w-4 h-4" /> All {filtered.length} episodes</>}
              </button>
            )}
          </div>
        )}

        {/* Cast */}
        <CastGrid cast={series.cast} />

        {/* Reviews */}
        <div className="mt-10 sm:mt-12">
          <ReviewSection targetType="Series" targetId={series._id} reviews={reviews} userId={userId} />
        </div>
      </div>
    </div>
  );
}
