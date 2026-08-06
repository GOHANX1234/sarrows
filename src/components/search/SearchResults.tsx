"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import ContentCard from "@/components/cards/ContentCard";
import { Search, Loader2, Film, Tv, Monitor, X, Clock, Trash2 } from "lucide-react";

const HISTORY_KEY = "sarrows_search_history";
const MAX_HISTORY = 10;

function getHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveToHistory(query: string) {
  if (!query || query.trim().length < 2) return;
  const trimmed = query.trim();
  const prev = getHistory().filter((h) => h.toLowerCase() !== trimmed.toLowerCase());
  const next = [trimmed, ...prev].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

function removeFromHistory(query: string) {
  const next = getHistory().filter((h) => h !== query);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

interface Props {
  movies: any[];
  series: any[];
  query: string;
}

type Tab = "all" | "movies" | "anime" | "series";

export default function SearchResults({ movies, series, query }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(query);
  const [tab, setTab] = useState<Tab>("all");
  const [isPending, startTransition] = useTransition();
  const [isFocused, setIsFocused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRef = useRef<string>("");

  // Split non-movie series into anime and web series
  const anime = series.filter((s) => s.type === "anime");
  const webSeries = series.filter((s) => s.type === "series" || (!s.type && s.type !== "anime"));

  // Load history on mount
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  // Auto-focus on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Save to history once a real search settles (debounce resolved + min 2 chars)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const trimmed = q.trim();
      const url = trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search";
      startTransition(() => router.replace(url, { scroll: false }));

      // Save to history only when there's a real query we haven't already saved
      if (trimmed.length >= 2 && trimmed !== savedRef.current) {
        savedRef.current = trimmed;
        saveToHistory(trimmed);
        setHistory(getHistory());
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Reset tab when results change
  useEffect(() => { setTab("all"); }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const applyHistoryItem = useCallback((term: string) => {
    setQ(term);
    setIsFocused(false);
    inputRef.current?.focus();
  }, []);

  const handleRemoveHistory = useCallback((e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    removeFromHistory(term);
    setHistory(getHistory());
  }, []);

  const handleClearAll = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  const totalCount = movies.length + anime.length + webSeries.length;
  const showMovies = tab === "all" || tab === "movies";
  const showAnime = tab === "all" || tab === "anime";
  const showSeries = tab === "all" || tab === "series";
  const showDropdown = isFocused && !q.trim() && history.length > 0;

  const tabs = [
    { id: "all" as Tab, label: "All", count: totalCount },
    { id: "movies" as Tab, label: "Movies", count: movies.length },
    { id: "anime" as Tab, label: "Anime", count: anime.length },
    { id: "series" as Tab, label: "Web Series", count: webSeries.length },
  ];

  return (
    <div className="space-y-6">

      {/* â”€â”€ Search input + history dropdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="relative" ref={wrapperRef}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ zIndex: 1 }}>
          {isPending
            ? <Loader2 className="w-5 h-5 text-sarrows-red animate-spin" />
            : <Search className="w-5 h-5 text-gray-500" />}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search movies, anime & web seriesâ€¦"
          className="w-full rounded-2xl py-3.5 pl-12 pr-11 text-white text-base outline-none transition-all duration-200 focus:ring-2 focus:ring-sarrows-red/30"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: showDropdown ? "1rem 1rem 0 0" : undefined,
          }}
        />
        {q && (
          <button
            onClick={() => setQ("")}
            aria-label="Clear search"
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-600 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* â”€â”€ History dropdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {showDropdown && (
          <div
            className="absolute left-0 right-0 overflow-hidden"
            style={{
              top: "100%",
              background: "rgba(18,18,18,0.98)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderTop: "none",
              borderRadius: "0 0 1rem 1rem",
              backdropFilter: "blur(16px)",
              zIndex: 50,
              boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-600">
                Recent Searches
              </span>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-sarrows-red transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear all
              </button>
            </div>

            {/* History items */}
            <ul className="pb-2">
              {history.map((term) => (
                <li key={term}>
                  <button
                    onPointerDown={(e) => { e.preventDefault(); applyHistoryItem(term); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left group hover:bg-white/5 transition-colors"
                  >
                    <Clock className="w-4 h-4 text-gray-600 flex-none group-hover:text-gray-400 transition-colors" />
                    <span className="flex-1 text-sm text-gray-300 group-hover:text-white transition-colors truncate">
                      {term}
                    </span>
                    <span
                      role="button"
                      onPointerDown={(e) => { e.stopPropagation(); handleRemoveHistory(e as any, term); }}
                      aria-label={`Remove "${term}" from history`}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/10 text-gray-600 hover:text-white transition-all flex-none"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* â”€â”€ Empty prompt â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {!query && (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto rounded-2xl glass flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-gray-600" />
          </div>
          <p className="text-white font-semibold mb-1">Search anything</p>
          <p className="text-gray-500 text-sm">Find movies, anime & web series by title or description</p>
        </div>
      )}

      {/* â”€â”€ No results â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {query && totalCount === 0 && !isPending && (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto rounded-2xl glass flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-gray-600" />
          </div>
          <p className="text-white font-semibold mb-1">No results for "{query}"</p>
          <p className="text-gray-500 text-sm">Try a different title or keyword</p>
        </div>
      )}

      {/* â”€â”€ Results â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {query && totalCount > 0 && (
        <>
          {/* Result count + category tabs */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-gray-400 text-sm">
              <span className="text-white font-semibold">{totalCount}</span> results
            </p>

            {/* Tabs */}
            <div className="flex items-center gap-1 rounded-xl p-1"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    tab === t.id
                      ? "text-white bg-sarrows-red shadow-sm"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {t.label}
                  <span className={`text-[10px] tabular-nums ${tab === t.id ? "text-red-200" : "text-gray-700"}`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Movies section */}
          {showMovies && movies.length > 0 && (
            <section className="space-y-3">
              {tab === "all" && (
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-sarrows-red" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Movies</h2>
                  <span className="text-xs text-gray-600">{movies.length}</span>
                </div>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2.5 sm:gap-3 md:gap-4">
                {movies.map((m) => <ContentCard key={m._id} item={m} type="movie" />)}
              </div>
            </section>
          )}

          {/* Anime section */}
          {showAnime && anime.length > 0 && (
            <section className="space-y-3">
              {tab === "all" && (
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-sarrows-red" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Anime</h2>
                  <span className="text-xs text-gray-600">{anime.length}</span>
                </div>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2.5 sm:gap-3 md:gap-4">
                {anime.map((a) => <ContentCard key={a._id} item={a} type="series" />)}
              </div>
            </section>
          )}

          {/* Web Series section */}
          {showSeries && webSeries.length > 0 && (
            <section className="space-y-3">
              {tab === "all" && (
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-sarrows-red" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Web Series</h2>
                  <span className="text-xs text-gray-600">{webSeries.length}</span>
                </div>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2.5 sm:gap-3 md:gap-4">
                {webSeries.map((ws) => <ContentCard key={ws._id} item={ws} type="series" />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
