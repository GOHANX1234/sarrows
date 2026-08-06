"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Edit, Trash2, Film, Tv, Tag, X, Star, Clapperboard, Monitor, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import MovieForm from "./MovieForm";
import AnimeForm from "./AnimeForm";
import WebSeriesForm from "./WebSeriesForm";
import EpisodeManager from "./EpisodeManager";
import GenreManager from "./GenreManager";

type Tab = "movies" | "anime" | "series" | "genres";

interface Props {
  movies: any[];
  anime: any[];
  webSeries: any[];
  genres: any[];
}

/* Ã¢â€â‚¬Ã¢â€â‚¬ Stable sub-components defined OUTSIDE the parent Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
   Defining these inside AdminContentClient would create a new component type
   on every render, causing React to unmount/remount them and drop keyboard
   focus after each keystroke.
Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

interface SearchBarProps {
  searchQ: string;
  setSearchQ: (v: string) => void;
  setSearchResults: (v: any[] | null) => void;
  searching: boolean;
  placeholder: string;
  addLabel: string;
  onAdd: () => void;
}
function SearchBar({ searchQ, setSearchQ, setSearchResults, searching, placeholder, addLabel, onAdd }: SearchBarProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 animate-spin" />
        )}
        <input
          type="text"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-white/20 focus:bg-white/[0.06] transition"
        />
        {searchQ && !searching && (
          <button
            onClick={() => { setSearchQ(""); setSearchResults(null); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 btn-primary text-xs py-2.5 px-3.5 flex-none"
      >
        <Plus className="w-3.5 h-3.5" /> {addLabel}
      </button>
    </div>
  );
}

interface ListMetaProps {
  searchQ: string;
  searching: boolean;
  searchResults: any[] | null;
  baseList: any[];
  label: string;
}
function ListMeta({ searchQ, searching, searchResults, baseList, label }: ListMetaProps) {
  if (searchQ.trim()) {
    if (searching) return null;
    const count = searchResults?.length ?? 0;
    return (
      <p className="text-xs text-gray-500 font-medium mb-3">
        {count} result{count !== 1 ? "s" : ""} for &ldquo;{searchQ}&rdquo;
      </p>
    );
  }
  return (
    <p className="text-xs text-gray-500 font-medium mb-3">
      Recent {baseList.length} {label}
    </p>
  );
}

interface SeriesCardProps {
  s: any;
  onEdit: () => void;
  onDelete: () => void;
  onManageEpisodes: (s: any) => void;
}
function SeriesCard({ s, onEdit, onDelete, onManageEpisodes }: SeriesCardProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-white/[0.04]"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="w-9 h-12 rounded-lg overflow-hidden flex-none bg-white/5">
        {s.posterUrl && (
          <img src={s.posterUrl} alt={s.title} className="w-full h-full object-cover" />
        )}
      </div>
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
          {s.releaseYear && <span className="text-[10px] text-gray-600">{s.releaseYear}</span>}
          {s.rating > 0 && (
            <span className="text-[10px] text-yellow-400 flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-current" /> {s.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-none">
        <button
          onClick={() => onManageEpisodes(s)}
          aria-label={`Manage episodes for ${s.title}`}
          className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onEdit}
          aria-label={`Edit ${s.title}`}
          className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition"
        >
          <Edit className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          aria-label={`Delete ${s.title}`}
          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function AdminContentClient({
  movies: initialMovies,
  anime: initialAnime,
  webSeries: initialWebSeries,
  genres: initialGenres,
}: Props) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("movies");

  // Base lists (recent 10 from server, updated after add/edit/delete)
  const [movies, setMovies] = useState(initialMovies);
  const [anime, setAnime] = useState(initialAnime);
  const [webSeries, setWebSeries] = useState(initialWebSeries);
  const [genres, setGenres] = useState(initialGenres);

  // Search state Ã¢â‚¬â€ shared, reset on tab switch
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [editingMovie, setEditingMovie] = useState<any>(null);
  const [editingAnime, setEditingAnime] = useState<any>(null);
  const [editingWebSeries, setEditingWebSeries] = useState<any>(null);
  const [addingEpisodesTo, setAddingEpisodesTo] = useState<any>(null);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Tab from URL Ã¢â€â‚¬Ã¢â€â‚¬
  useEffect(() => {
    const p = searchParams.get("tab");
    if (p === "add-movie")  { setTab("movies");  setEditingMovie({}); }
    else if (p === "add-anime")  { setTab("anime");   setEditingAnime({}); }
    else if (p === "add-series") { setTab("series");  setEditingWebSeries({}); }
    else if (p === "anime")  setTab("anime");
    else if (p === "series") setTab("series");
    else if (p === "genres") setTab("genres");
    else setTab("movies");
  }, [searchParams]);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Reset search when tab changes Ã¢â€â‚¬Ã¢â€â‚¬
  const switchTab = (t: Tab) => {
    setTab(t);
    setSearchQ("");
    setSearchResults(null);
    closeAll();
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬ Live search with 300 ms debounce Ã¢â€â‚¬Ã¢â€â‚¬
  const runSearch = useCallback(async (q: string, currentTab: Tab) => {
    if (!q.trim()) { setSearchResults(null); return; }
    setSearching(true);
    try {
      let url = "";
      if (currentTab === "movies") {
        url = `/api/admin/movies?q=${encodeURIComponent(q)}&limit=20&sort=latest`;
      } else if (currentTab === "anime") {
        url = `/api/admin/series?q=${encodeURIComponent(q)}&type=anime&limit=20&sort=latest`;
      } else if (currentTab === "series") {
        url = `/api/admin/series?q=${encodeURIComponent(q)}&type=series&limit=20&sort=latest`;
      }
      if (!url) return;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setSearchResults(data.movies ?? data.series ?? []);
    } catch {
      // silently fail Ã¢â‚¬â€ show whatever was there before
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQ.trim()) { setSearchResults(null); return; }
    debounceRef.current = setTimeout(() => runSearch(searchQ, tab), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQ, tab, runSearch]);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Delete handlers Ã¢â€â‚¬Ã¢â€â‚¬
  const deleteMovie = async (id: string) => {
    if (!confirm("Delete this movie?")) return;
    await fetch(`/api/movies/${id}`, { method: "DELETE" });
    setMovies((prev) => prev.filter((m) => m._id !== id));
    setSearchResults((prev) => prev ? prev.filter((m) => m._id !== id) : null);
  };

  const deleteAnime = async (id: string) => {
    if (!confirm("Delete this anime?")) return;
    await fetch(`/api/admin/series/${id}`, { method: "DELETE" });
    setAnime((prev) => prev.filter((a) => a._id !== id));
    setSearchResults((prev) => prev ? prev.filter((a) => a._id !== id) : null);
  };

  const deleteWebSeries = async (id: string) => {
    if (!confirm("Delete this web series?")) return;
    await fetch(`/api/admin/series/${id}`, { method: "DELETE" });
    setWebSeries((prev) => prev.filter((s) => s._id !== id));
    setSearchResults((prev) => prev ? prev.filter((s) => s._id !== id) : null);
  };

  const closeAll = () => {
    setEditingMovie(null);
    setEditingAnime(null);
    setEditingWebSeries(null);
    setAddingEpisodesTo(null);
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬ Counts shown in tabs (base list size, not search) Ã¢â€â‚¬Ã¢â€â‚¬
  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: "movies",  label: "Movies",     icon: Film,    count: movies.length },
    { key: "anime",   label: "Anime",       icon: Tv,      count: anime.length },
    { key: "series",  label: "Web Series",  icon: Monitor, count: webSeries.length },
    { key: "genres",  label: "Genres",      icon: Tag,     count: genres.length },
  ];

  // Ã¢â€â‚¬Ã¢â€â‚¬ FormModal (needs parent state Ã¢â‚¬â€ kept inside) Ã¢â€â‚¬Ã¢â€â‚¬
  const FormModal = ({
    title,
    onClose,
    children,
  }: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
  }) => (
    <div
      className="mb-5 rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <h2 className="text-sm font-bold text-white">{title}</h2>
        <button
          onClick={onClose}
          aria-label="Close form"
          className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );

  // Which list to render Ã¢â‚¬â€ search results when searching, base list otherwise
  const displayMovies  = searchResults !== null ? searchResults : movies;
  const displayAnime   = searchResults !== null ? searchResults : anime;
  const displaySeries  = searchResults !== null ? searchResults : webSeries;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-5 pt-2">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Content</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage movies, anime, web series &amp; genres</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
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
              setMovies((prev) =>
                editingMovie._id ? prev.map((x) => x._id === m._id ? m : x) : [m, ...prev]
              );
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
              setAnime((prev) =>
                editingAnime._id ? prev.map((x) => x._id === s._id ? s : x) : [s, ...prev]
              );
              setEditingAnime(null);
            }}
            onGenreCreated={(g) => setGenres((prev) => [...prev, g])}
          />
        </FormModal>
      )}

      {/* Web Series form */}
      {editingWebSeries && (
        <FormModal
          title={editingWebSeries._id ? "Edit Web Series" : "Add New Web Series"}
          onClose={() => setEditingWebSeries(null)}
        >
          <WebSeriesForm
            genres={genres}
            initial={editingWebSeries}
            onSuccess={(s) => {
              setWebSeries((prev) =>
                editingWebSeries._id
                  ? prev.map((x) => x._id === s._id ? s : x)
                  : [s, ...prev]
              );
              setEditingWebSeries(null);
            }}
            onGenreCreated={(g) => setGenres((prev) => [...prev, g])}
          />
        </FormModal>
      )}

      {/* Episode manager */}
      {addingEpisodesTo && (
        <FormModal
          title={`Manage Episodes Â· ${addingEpisodesTo.title}`}
          onClose={() => setAddingEpisodesTo(null)}
        >
          <EpisodeManager series={addingEpisodesTo} />
        </FormModal>
      )}

      {/* Movies tab */}
      {tab === "movies" && (
        <div>
          <SearchBar
            searchQ={searchQ}
            setSearchQ={setSearchQ}
            setSearchResults={setSearchResults}
            searching={searching}
            placeholder="Search movies by title..."
            addLabel="New Movie"
            onAdd={() => setEditingMovie({})}
          />
          <ListMeta searchQ={searchQ} searching={searching} searchResults={searchResults} baseList={movies} label="movies" />
          <div className="space-y-2">
            {displayMovies.map((m) => (
              <div
                key={m._id}
                className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-white/[0.04]"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="w-9 h-12 rounded-lg overflow-hidden flex-none bg-white/5">
                  {m.posterUrl && (
                    <img src={m.posterUrl} alt={m.title} className="w-full h-full object-cover" />
                  )}
                </div>
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
                    {m.releaseYear && <span className="text-[10px] text-gray-600">{m.releaseYear}</span>}
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
            {!searching && displayMovies.length === 0 && (
              <div className="text-center py-16 text-gray-600 text-sm">
                {searchQ.trim() ? `No movies found for "${searchQ}".` : "No movies yet - add one above."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Anime tab */}
      {tab === "anime" && (
        <div>
          <SearchBar
            searchQ={searchQ}
            setSearchQ={setSearchQ}
            setSearchResults={setSearchResults}
            searching={searching}
            placeholder="Search anime by title..."
            addLabel="New Anime"
            onAdd={() => setEditingAnime({})}
          />
          <ListMeta searchQ={searchQ} searching={searching} searchResults={searchResults} baseList={anime} label="anime" />
          <div className="space-y-2">
            {displayAnime.map((s) => (
              <SeriesCard
                key={s._id}
                s={s}
                onEdit={() => { setEditingAnime(s); setTab("anime"); }}
                onDelete={() => deleteAnime(s._id)}
                onManageEpisodes={setAddingEpisodesTo}
              />
            ))}
            {!searching && displayAnime.length === 0 && (
              <div className="text-center py-16 text-gray-600 text-sm">
                {searchQ.trim() ? `No anime found for "${searchQ}".` : "No anime yet - add one above."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Web Series tab */}
      {tab === "series" && (
        <div>
          <SearchBar
            searchQ={searchQ}
            setSearchQ={setSearchQ}
            setSearchResults={setSearchResults}
            searching={searching}
            placeholder="Search web series by title..."
            addLabel="New Web Series"
            onAdd={() => setEditingWebSeries({})}
          />
          <ListMeta searchQ={searchQ} searching={searching} searchResults={searchResults} baseList={webSeries} label="web series" />
          <div className="space-y-2">
            {displaySeries.map((s) => (
              <SeriesCard
                key={s._id}
                s={s}
                onEdit={() => { setEditingWebSeries(s); setTab("series"); }}
                onDelete={() => deleteWebSeries(s._id)}
                onManageEpisodes={setAddingEpisodesTo}
              />
            ))}
            {!searching && displaySeries.length === 0 && (
              <div className="text-center py-16 text-gray-600 text-sm">
                {searchQ.trim() ? `No web series found for "${searchQ}".` : "No web series yet - add one above."}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "genres" && <GenreManager genres={genres} onUpdate={setGenres} />}
    </div>
  );
}
