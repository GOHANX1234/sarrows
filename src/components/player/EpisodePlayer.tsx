"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, List } from "lucide-react";
import VideoPlayer from "./VideoPlayer";

interface Props {
  episode: any;
  series: any;
  prevEpisode: any | null;
  nextEpisode: any | null;
}

export default function EpisodePlayer({ episode, series, prevEpisode, nextEpisode }: Props) {
  const [embedSrc, setEmbedSrc] = useState<string | null>(null);
  const [embedError, setEmbedError] = useState(false);

  useEffect(() => {
    if (episode.streamType !== "embed") return;
    let cancelled = false;
    fetch(`/api/stream/episode/${episode._id}/embed`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load video");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setEmbedSrc(data.url);
      })
      .catch(() => {
        if (!cancelled) setEmbedError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [episode._id, episode.streamType]);

  const handleProgress = async (seconds: number) => {
    fetch("/api/watch-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "Episode", targetId: episode._id, progressSeconds: seconds }),
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-sarrows-darker">
      {/* Top bar */}
      <div className="glass-navbar px-4 md:px-8 h-12 flex items-center justify-between">
        <Link href={`/anime/${series.slug}`} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{series.title}</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <div className="text-sm font-medium text-gray-300 truncate max-w-xs">
          S{episode.season} E{episode.episodeNumber}
          {episode.title && <span className="text-gray-500"> — {episode.title}</span>}
        </div>
        <Link href={`/anime/${series.slug}`} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition glass px-3 py-1.5 rounded-lg">
          <List className="w-3.5 h-3.5" /> All Episodes
        </Link>
      </div>

      {/* Player area */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
        {episode.hasVideo && (episode.streamType !== "embed" || embedSrc) ? (
          <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <VideoPlayer
              src={episode.streamType === "embed" ? (embedSrc as string) : `/api/stream/episode/${episode._id}`}
              type={episode.streamType}
              poster={series.bannerUrl || series.posterUrl}
              title={`${series.title} · EP${episode.episodeNumber}`}
              onProgress={handleProgress}
            />
          </div>
        ) : episode.hasVideo && episode.streamType === "embed" && embedError ? (
          <div className="aspect-video glass-card rounded-2xl flex items-center justify-center">
            <p className="text-gray-500 text-sm">Couldn't load this video. Try refreshing.</p>
          </div>
        ) : episode.hasVideo ? (
          <div className="aspect-video glass-card rounded-2xl flex items-center justify-center">
            <p className="text-gray-500 text-sm">Loading video…</p>
          </div>
        ) : (
          <div className="aspect-video glass-card rounded-2xl flex items-center justify-center">
            <p className="text-gray-500 text-sm">No video available for this episode</p>
          </div>
        )}

        {/* Episode info */}
        <div className="mt-5 glass-card rounded-2xl px-5 py-4">
          <p className="text-[11px] text-gray-600 font-medium uppercase tracking-wider mb-1">{series.title}</p>
          <h1 className="text-lg font-bold text-white">
            Season {episode.season} · Episode {episode.episodeNumber}
            {episode.title && <span className="text-gray-400 font-normal"> — {episode.title}</span>}
          </h1>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4 gap-3">
          {prevEpisode ? (
            <Link
              href={`/anime/${series.slug}/episode/${prevEpisode._id}`}
              className="btn-secondary text-sm flex-1 sm:flex-none justify-center sm:justify-start"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Ep {prevEpisode.episodeNumber}</span>
              {prevEpisode.title && <span className="hidden sm:inline text-gray-500 truncate max-w-[120px]"> — {prevEpisode.title}</span>}
            </Link>
          ) : <div />}

          {nextEpisode && (
            <Link
              href={`/anime/${series.slug}/episode/${nextEpisode._id}`}
              className="btn-primary text-sm flex-1 sm:flex-none justify-center sm:justify-end"
            >
              <span>Ep {nextEpisode.episodeNumber}</span>
              {nextEpisode.title && <span className="hidden sm:inline truncate max-w-[120px]"> — {nextEpisode.title}</span>}
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
