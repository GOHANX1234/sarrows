"use client";

import Image from "next/image";
import { useState } from "react";
import { Star, Clock, Eye, Play, Calendar, Film, X, Clapperboard } from "lucide-react";
import VideoPlayer from "@/components/player/VideoPlayer";
import ReviewSection from "@/components/reviews/ReviewSection";
import WatchlistButton from "@/components/ui/WatchlistButton";
import CastGrid from "@/components/detail/CastGrid";
import { formatDuration, formatViews } from "@/lib/utils";

interface Props {
  movie: any;
  reviews: any[];
  userId?: string;
  userRole?: string;
}

export default function MovieDetailClient({ movie, reviews, userId, userRole }: Props) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [embedSrc, setEmbedSrc] = useState<string | null>(null);
  const [loadingEmbed, setLoadingEmbed] = useState(false);

  const handleWatch = async () => {
    if (movie.streamType === "embed") {
      setLoadingEmbed(true);
      try {
        const res = await fetch(`/api/stream/movie/${movie._id}/embed`);
        if (!res.ok) throw new Error("Failed to load video");
        const data = await res.json();
        setEmbedSrc(data.url);
        setShowPlayer(true);
      } catch {
        // Swallow — the "No video available" state already covers failure to load.
      } finally {
        setLoadingEmbed(false);
      }
    } else {
      setShowPlayer(true);
    }
  };

  const handleProgress = async (seconds: number) => {
    if (!userId) return;
    fetch("/api/watch-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "Movie", targetId: movie._id, progressSeconds: seconds }),
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen">

      {/* Banner */}
      <div className="relative h-52 sm:h-72 md:h-[420px] overflow-hidden">
        {movie.bannerUrl || movie.posterUrl ? (
          <Image
            src={movie.bannerUrl || movie.posterUrl}
            alt={movie.title}
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
            {movie.posterUrl ? (
              <Image
                src={movie.posterUrl}
                alt={movie.title}
                width={208}
                height={312}
                className="rounded-xl sm:rounded-2xl shadow-2xl object-cover w-full"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              />
            ) : (
              <div className="w-full aspect-[2/3] rounded-xl sm:rounded-2xl glass flex items-center justify-center">
                <Film className="w-8 h-8 text-gray-700" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 sm:pt-16 md:pt-24 min-w-0">

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-2.5">
              <span className="glass-red px-2.5 py-0.5 rounded-full text-[10px] font-bold text-sarrows-red uppercase tracking-wider">
                Movie
              </span>
              {movie.releaseYear && (
                <span className="glass px-2.5 py-0.5 rounded-full text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {movie.releaseYear}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-3xl md:text-5xl font-black text-white mb-3 leading-tight">
              {movie.title}
            </h1>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-4 text-sm">
              {movie.rating > 0 && (
                <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  {movie.rating.toFixed(1)}
                  <span className="text-gray-600 font-normal text-xs">({movie.ratingCount})</span>
                </div>
              )}
              {movie.duration && (
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                  <Clock className="w-3.5 h-3.5" /> {formatDuration(movie.duration)}
                </div>
              )}
              {movie.views > 0 && (
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <Eye className="w-3.5 h-3.5" /> {formatViews(movie.views)}
                </div>
              )}
            </div>

            {/* Genres */}
            {movie.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {movie.genres.map((g: any) => (
                  <span key={g._id} className="glass px-2.5 py-0.5 rounded-full text-xs text-gray-300">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {movie.description && (
              <p className="text-gray-400 leading-relaxed mb-5 max-w-2xl text-sm">
                {movie.description}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {movie.hasVideo ? (
                <button onClick={handleWatch} disabled={loadingEmbed} className="btn-primary text-sm px-5 py-2.5 disabled:opacity-60">
                  <Play className="w-4 h-4 fill-current" /> {loadingEmbed ? "Loading…" : "Watch Movie"}
                </button>
              ) : (
                <span className="text-gray-600 text-sm italic">No video available yet</span>
              )}
              {movie.trailerUrl && (
                <a
                  href={movie.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm px-5 py-2.5"
                >
                  <Clapperboard className="w-4 h-4" /> Trailer
                </a>
              )}
              {userId && <WatchlistButton targetType="Movie" targetId={movie._id} userId={userId} />}
            </div>
          </div>
        </div>

        {/* Video player */}
        {showPlayer && movie.hasVideo && (movie.streamType !== "embed" || embedSrc) && (
          <div className="mt-8 rounded-xl sm:rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-sm font-medium text-white truncate pr-4">{movie.title}</span>
              <button
                onClick={() => setShowPlayer(false)}
                className="text-gray-500 hover:text-white transition p-1 rounded-lg hover:bg-white/10 flex-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <VideoPlayer
              src={movie.streamType === "embed" ? (embedSrc as string) : `/api/stream/movie/${movie._id}`}
              type={movie.streamType}
              poster={movie.bannerUrl || movie.posterUrl}
              title={movie.title}
              onProgress={handleProgress}
            />
          </div>
        )}

        {/* Cast */}
        <CastGrid cast={movie.cast} />

        {/* Reviews */}
        <div className="mt-10 sm:mt-12">
          <ReviewSection targetType="Movie" targetId={movie._id} reviews={reviews} userId={userId} />
        </div>
      </div>
    </div>
  );
}
