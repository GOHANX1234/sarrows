"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Film, Tv, Clock, Play, Shield, Bookmark, ChevronRight, Calendar, Inbox } from "lucide-react";
import RequestBox from "./RequestBox";

interface Props {
  user: any;
  history: any[];
  isOwner: boolean;
}

export default function ProfileClient({ user, history, isOwner }: Props) {
  const [activeTab, setActiveTab] = useState<"history" | "requests" | "about">("history");

  const joined = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const initial = user.nickname?.[0]?.toUpperCase() || "?";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

      {/* ── Profile card ───────────────────────────────── */}
      <div
        className="rounded-2xl p-5 sm:p-6 mb-6"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-sarrows-red to-red-800 flex items-center justify-center flex-none shadow-lg shadow-red-900/30">
            <span className="text-2xl sm:text-3xl font-black text-white select-none">{initial}</span>
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-white truncate">{user.nickname}</h1>
              {user.role === "admin" && (
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-sarrows-red flex-none"
                  style={{ background: "rgba(229,9,20,0.12)", border: "1px solid rgba(229,9,20,0.25)" }}
                >
                  <Shield className="w-2.5 h-2.5" /> Admin
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>Joined {joined}</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        {isOwner && (
          <div
            className="grid grid-cols-2 gap-3 mt-5 pt-5"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="rounded-xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-2xl font-black text-white">{history.length}</p>
              <p className="text-[11px] text-gray-500 mt-0.5 uppercase tracking-wider">Watched</p>
            </div>
            <Link
              href="/watchlist"
              className="rounded-xl p-3 text-center flex flex-col items-center justify-center transition-all hover:bg-white/[0.07] group"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <Bookmark className="w-5 h-5 text-gray-400 group-hover:text-sarrows-red transition-colors mb-1" />
              <p className="text-[11px] text-gray-500 uppercase tracking-wider group-hover:text-gray-300 transition-colors">Watchlist</p>
            </Link>
          </div>
        )}
      </div>

      {/* ── Tabs (only for owner) ──────────────────────── */}
      {isOwner && (
        <>
          <div
            className="flex items-center gap-1 rounded-xl p-1 mb-5"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            {(["history", "requests", "about"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 capitalize ${
                  activeTab === t
                    ? "text-white bg-sarrows-red shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {t === "history" && <Clock className="w-3.5 h-3.5" />}
                {t === "requests" && <Inbox className="w-3.5 h-3.5" />}
                {t === "about" && <Shield className="w-3.5 h-3.5" />}
                {t === "history" ? "Watch History" : t === "requests" ? "Requests" : "About"}
              </button>
            ))}
          </div>

          {/* Watch History tab */}
          {activeTab === "history" && (
            <section>
              {history.length === 0 ? (
                <div
                  className="rounded-2xl py-14 text-center"
                  style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="w-14 h-14 mx-auto rounded-2xl glass flex items-center justify-center mb-4">
                    <Play className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-gray-400 font-medium mb-1">No watch history yet</p>
                  <p className="text-gray-600 text-sm mb-5">Start watching to see your history here</p>
                  <div className="flex items-center justify-center gap-3">
                    <Link href="/movies" className="btn-primary text-sm px-5 py-2">Movies</Link>
                    <Link href="/anime" className="btn-secondary text-sm px-5 py-2">Anime</Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((h) => {
                    const content = h.targetId as any;
                    const isMovie = h.targetType === "Movie";

                    // Movies: targetId is a Movie doc with slug
                    // Episodes: targetId is an Episode doc with series.slug + _id
                    let href: string | null = null;
                    let poster: string | null = null;
                    let title: string = isMovie ? "Movie" : "Episode";
                    let subtitle: string | null = null;

                    if (isMovie) {
                      if (content?.slug) href = `/movies/${content.slug}`;
                      poster = content?.posterUrl || null;
                      title = content?.title || "Movie";
                    } else {
                      // Episode — seriesDoc is attached by the server
                      const sd = content?.seriesDoc;
                      if (sd?.slug && content?._id) {
                        href = `/anime/${sd.slug}/episode/${content._id}`;
                      }
                      poster = sd?.posterUrl || content?.posterUrl || null;
                      title = sd?.title || content?.title || "Anime";
                      if (content?.title && sd?.title && content.title !== sd.title) {
                        subtitle = content.title;
                      } else if (content?.episodeNumber) {
                        subtitle = `Episode ${content.episodeNumber}`;
                      }
                    }

                    const inner = (
                      <div className="flex items-center gap-3 sm:gap-4 rounded-xl p-3 sm:p-3.5 transition-all duration-200 group hover:bg-white/[0.06]"
                        style={{ border: "1px solid rgba(255,255,255,0.06)" }}>

                        {/* Thumbnail */}
                        <div className="flex-none w-10 h-[54px] sm:w-12 sm:h-16 rounded-lg overflow-hidden relative"
                          style={{ background: "rgba(255,255,255,0.05)" }}>
                          {poster ? (
                            <Image src={poster} alt={title} fill className="object-cover" sizes="48px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {isMovie
                                ? <Film className="w-4 h-4 text-gray-700" />
                                : <Tv className="w-4 h-4 text-gray-700" />}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isMovie ? "text-blue-400" : "text-purple-400"}`}>
                            {isMovie ? "Movie" : "Anime"}
                          </span>
                          <p className="text-sm font-semibold text-white truncate mt-0.5 group-hover:text-sarrows-red transition-colors">
                            {title}
                          </p>
                          {subtitle && (
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">{subtitle}</p>
                          )}
                        </div>

                        {/* Date + arrow */}
                        <div className="flex-none flex flex-col items-end gap-1.5">
                          <span className="text-[11px] text-gray-600">
                            {new Date(h.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                          {href && (
                            <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-sarrows-red transition-colors" />
                          )}
                        </div>
                      </div>
                    );

                    return href ? (
                      <Link key={h._id} href={href}>{inner}</Link>
                    ) : (
                      <div key={h._id}>{inner}</div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Requests tab */}
          {activeTab === "requests" && <RequestBox />}

          {/* About tab */}
          {activeTab === "about" && (
            <section
              className="rounded-2xl p-5 space-y-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <Row label="Username" value={user.nickname} />
              <Row label="Email" value={user.email} />
              <Row label="Role" value={user.role === "admin" ? "Administrator" : "Member"} />
              <Row label="Joined" value={joined} />
              <Row label="Titles watched" value={String(history.length)} />
            </section>
          )}
        </>
      )}

      {/* Public view */}
      {!isOwner && (
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="text-gray-500 text-sm">This profile is private.</p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</span>
      <span className="text-sm text-white font-medium text-right truncate max-w-[60%]">{value}</span>
    </div>
  );
}
