"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Edit, Trash2, Film, Tv, Tag, X, Star, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";
import MovieForm from "./MovieForm";
import AnimeForm from "./AnimeForm";
import EpisodeManager from "./EpisodeManager";
import GenreManager from "./GenreManager";

type Tab = "movies" | "anime" | "genres";

interface Props {
  movies: any[];
  anime: any[];
  genres: any[];
}

export default function AdminContentClient({ movies: initialMovies, anime: initialAnime, genres: initialGenres }: Props) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("movies");
  const [movies, setMovies] = useState(initialMovies);
  const [anime, setAnime] = useState(initialAnime);
  const [genres, setGenres] = useState(initialGenres);
  const [editingMovie, setEditingMovie] = useState<any>(null);
  const [editingAnime, setEditingAnime] = useState<any>(null);
  const [addingEpisodesTo, setAddingEpisodesTo] = useState<any>(null);

  // Read ?tab= param on mount to support dashboard quick-action links
  useEffect(() => {
    const p = searchParams.get("tab");
    if (p === "add-movie") { setTab("movies"); setEditingMovie({}); }
    else if (p === "add-anime") { setTab("anime"); setEditingAnime({}); }
    else if (p === "anime") setTab("anime");
    else if (p === "genres") setTab("genres");
    else setTab("movies");
  }, [searchParams]);

  const deleteMovie = async (id: string) => {
    if (!confirm("Delete this movie?")) return;
    await fetch(`/api/movies/${id}`, { method: "DELETE" });
    setMovies(movies.filter((m) => m._id !== id));
  };

  const deleteAnime = async (id: string) => {
    if (!confirm("Delete this anime?")) return;
    await fetch(`/api/admin/series/${id}`, { method: "DELETE" });
    setAnime(anime.filter((a) => a._id !== id));
  };

  const closeAll = () => { setEditingMovie(null); setEditingAnime(null); setAddingEpisodesTo(null); };

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: "movies", label: "Movies", icon: Film, count: movies.length },
    { key: "anime", label: "Anime", icon: Tv, count: anime.length },
    { key: "genres", label: "Genres", icon: Tag, count: genres.length },
  ];

  const FormModal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
    <div
      className="mb-5 rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <h2 className="text-sm font-bold text-white">{title}</h2>
        <button onClick={onClose} aria-label="Close form" className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-5 pt-2">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Content</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage movies, anime & genres</p>
      </div>

      {/* Tab bar — scrollable on narrow screens */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); closeAll(); }}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-none",
              tab === t.key
                ? "bg-sarrows-red text-white"
                : "text-gray-400 hover:text-white hover:bg-white/[0.07]"
            )}
            style={tab === t.key ? {} : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.count !== undefined && (
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                tab === t.key ? "bg-white/20 text-white" : "bg-white/10 text-gray-500"
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Movie form */}
      {editingMovie && (
        <FormModal
          title={editingMovie._id ? "Edit Movie" : "Add New Movie"}
          onClose={() => setEditingMovie(null)}
        >
          <MovieForm
            genres={genres}
            initial={editingMovie}
            onSuccess={(m) => {
              setMovies(editingMovie._id ? movies.map((x) => x._id === m._id ? m : x) : [m, ...movies]);
              setEditingMovie(null);
            }}
            onGenreCreated={(g) => setGenres((prev) => [...prev, g])}
          />
        </FormModal>
      )}

      {/* Anime form */}
      {editingAnime && (
        <FormModal
          title={editingAnime._id ? "Edit Anime" : "Add New Anime"}
          onClose={() => setEditingAnime(null)}
        >
          <AnimeForm
            genres={genres}
            initial={editingAnime}
            onSuccess={(s) => {
              setAnime(editingAnime._id ? anime.map((x) => x._id === s._id ? s : x) : [s, ...anime]);
              setEditingAnime(null);
            }}
            onGenreCreated={(g) => setGenres((prev) => [...prev, g])}
          />
        </FormModal>
      )}

      {/* Episode manager */}
      {addingEpisodesTo && (
        <FormModal
          title={`Manage Episodes · ${addingEpisodesTo.title}`}
          onClose={() => setAddingEpisodesTo(null)}
        >
          <EpisodeManager series={addingEpisodesTo} />
        </FormModal>
      )}

      {/* Movies list */}
      {tab === "movies" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">{movies.length} movies</span>
            <button
              onClick={() => setEditingMovie({})}
              className="flex items-center gap-1.5 btn-primary text-xs py-2 px-3.5"
            >
              <Plus className="w-3.5 h-3.5" /> New Movie
            </button>
          </div>
          <div className="space-y-2">
            {movies.map((m) => (
              <div
                key={m._id}
                className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-white/[0.04]"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                {/* Poster */}
                <div className="w-9 h-12 rounded-lg overflow-hidden flex-none bg-white/5">
                  {m.posterUrl && (
                    <img src={m.posterUrl} alt={m.title} className="w-full h-full object-cover" />
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate leading-tight">{m.title}</p>
                  <div className="flex items-center flex-wrap gap-1.5 mt-1">
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      m.status === "published"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-yellow-500/15 text-yellow-400"
                    )}>
                      {m.status}
                    </span>
                    {m.releaseYear && (
                      <span className="text-[10px] text-gray-600">{m.releaseYear}</span>
                    )}
                    {m.rating > 0 && (
                      <span className="text-[10px] text-yellow-400 flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-current" /> {m.rating.toFixed(1)}
                      </span>
                    )}
                    {m.trailerUrl && (
                      <span className="text-[10px] text-gray-600 flex items-center gap-0.5">
                        <Clapperboard className="w-2.5 h-2.5" /> Trailer
                      </span>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 flex-none">
                  <button
                    onClick={() => { setEditingMovie(m); setTab("movies"); }}
                    aria-label={`Edit ${m.title}`}
                    className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteMovie(m._id)}
                    aria-label={`Delete ${m.title}`}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {movies.length === 0 && (
              <div className="text-center py-16 text-gray-600 text-sm">No movies yet — add one above.</div>
            )}
          </div>
        </div>
      )}

      {/* Anime list */}
      {tab === "anime" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">{anime.length} anime</span>
            <button
              onClick={() => setEditingAnime({})}
              className="flex items-center gap-1.5 btn-primary text-xs py-2 px-3.5"
            >
              <Plus className="w-3.5 h-3.5" /> New Anime
            </button>
          </div>
          <div className="space-y-2">
            {anime.map((s) => (
              <div
                key={s._id}
                className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-white/[0.04]"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                {/* Poster */}
                <div className="w-9 h-12 rounded-lg overflow-hidden flex-none bg-white/5">
                  {s.posterUrl && (
                    <img src={s.posterUrl} alt={s.title} className="w-full h-full object-cover" />
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate leading-tight">{s.title}</p>
                  <div className="flex items-center flex-wrap gap-1.5 mt-1">
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      s.publishStatus === "published"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-yellow-500/15 text-yellow-400"
                    )}>
                      {s.publishStatus}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      s.status === "ongoing"
                        ? "bg-blue-500/15 text-blue-400"
                        : "bg-gray-500/15 text-gray-400"
                    )}>
                      {s.status}
                    </span>
                    {s.rating > 0 && (
                      <span className="text-[10px] text-yellow-400 flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-current" /> {s.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 flex-none">
                  <button
                    onClick={() => setAddingEpisodesTo(s)}
                    aria-label={`Manage episodes for ${s.title}`}
                    className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setEditingAnime(s); setTab("anime"); }}
                    aria-label={`Edit ${s.title}`}
                    className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteAnime(s._id)}
                    aria-label={`Delete ${s.title}`}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {anime.length === 0 && (
              <div className="text-center py-16 text-gray-600 text-sm">No anime yet — add one above.</div>
            )}
          </div>
        </div>
      )}

      {tab === "genres" && <GenreManager genres={genres} onUpdate={setGenres} />}
    </div>
  );
}
