"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { resolveGenreNames } from "@/lib/genre-utils";
import CastEditor, { CastMember } from "./CastEditor";

interface Props {
  genres: any[];
  initial?: any;
  onSuccess: (series: any) => void;
  onGenreCreated?: (genre: any) => void;
}

export default function WebSeriesForm({ genres, initial, onSuccess, onGenreCreated }: Props) {
  const isEdit = !!initial?._id;
  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    posterUrl: initial?.posterUrl || "",
    bannerUrl: initial?.bannerUrl || "",
    trailerUrl: initial?.trailerUrl || "",
    externalId: initial?.externalId || "",
    totalSeasons: initial?.totalSeasons || 1,
    releaseYear: initial?.releaseYear ?? "",
    genres: (initial?.genres?.map((g: any) => g._id || g) || []) as string[],
    status: initial?.status || "ongoing",
    publishStatus: initial?.publishStatus || "draft",
    type: "series" as const,
    rating: initial?.rating ?? "",
  });
  const [cast, setCast] = useState<CastMember[]>(initial?.cast || []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [tmdbSearch, setTmdbSearch] = useState("");
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const searchTMDB = async () => {
    if (!tmdbSearch.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/admin/tmdb/search?type=tv&q=${encodeURIComponent(tmdbSearch)}`
      );
      const data = await res.json();
      setTmdbResults(data.results || []);
    } finally {
      setSearching(false);
    }
  };

  const fillFromTMDB = async (result: any) => {
    setForm((prev) => ({
      ...prev,
      title: result.title || prev.title,
      description: result.description || prev.description,
      posterUrl: result.posterUrl || prev.posterUrl,
      bannerUrl: result.bannerUrl || prev.bannerUrl,
      externalId: result.externalId || prev.externalId,
      releaseYear: result.releaseYear ?? prev.releaseYear,
      totalSeasons: result.totalSeasons ?? prev.totalSeasons,
      rating: result.rating != null ? Math.round(result.rating * 10) / 10 : prev.rating,
    }));
    setTmdbResults([]);
    setTmdbSearch("");

    setLoadingDetails(true);
    try {
      if (result.externalId) {
        // Single call to the TV detail endpoint — returns { genreNames, cast }
        const res = await fetch(`/api/admin/tmdb/tv/${result.externalId}`);
        const data = res.ok ? await res.json() : null;

        const tasks: Promise<void>[] = [];

        if (data?.genreNames?.length) {
          tasks.push(
            resolveGenreNames(data.genreNames, genres, onGenreCreated).then((genreIds) => {
              setForm((prev) => ({
                ...prev,
                genres: Array.from(new Set([...prev.genres, ...genreIds])),
              }));
            })
          );
        }

        if (data?.cast?.length) {
          setCast(data.cast);
        } else {
          setCast([]);
        }

        if (data?.trailerUrl) {
          setForm((prev) => ({ ...prev, trailerUrl: data.trailerUrl || prev.trailerUrl }));
        }

        await Promise.all(tasks);
      } else {
        setCast([]);
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  const set = (key: string, val: any) => setForm((p) => ({ ...p, [key]: val }));

  const toggleGenre = (id: string) => {
    setForm((p) => ({
      ...p,
      genres: p.genres.includes(id)
        ? p.genres.filter((g) => g !== id)
        : [...p.genres, id],
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const url = isEdit ? `/api/admin/series/${initial._id}` : "/api/admin/series";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          type: "series",
          totalSeasons: form.totalSeasons ? Number(form.totalSeasons) : undefined,
          releaseYear: form.releaseYear ? Number(form.releaseYear) : undefined,
          rating: form.rating !== "" ? Number(form.rating) : undefined,
          cast,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); return; }
      onSuccess(data.series);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* TMDB search */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Auto-fill from TMDB
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tmdbSearch}
            onChange={(e) => setTmdbSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchTMDB())}
            placeholder="Search TV series on TMDB…"
            className="input-field flex-1"
          />
          <button
            type="button"
            onClick={searchTMDB}
            disabled={searching}
            className="btn-primary px-3.5 py-2 text-sm disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {tmdbResults.length > 0 && (
          <div
            className="mt-2 rounded-xl overflow-hidden divide-y divide-white/[0.06]"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          >
            {tmdbResults.map((r) => (
              <button
                key={r.externalId}
                type="button"
                onClick={() => fillFromTMDB(r)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.06] transition"
              >
                {r.posterUrl && (
                  <img
                    src={r.posterUrl}
                    alt={r.title}
                    className="w-8 h-11 rounded object-cover flex-none"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{r.title}</p>
                  <p className="text-gray-500 text-xs">
                    {r.releaseYear ?? "—"}
                    {r.totalSeasons ? ` · ${r.totalSeasons} season${r.totalSeasons !== 1 ? "s" : ""}` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {loadingDetails && (
          <p className="text-xs text-gray-500 mt-1.5">Loading cast & genres…</p>
        )}
      </div>

      {/* Core fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="input-field"
            placeholder="Series title"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="input-field resize-none"
            rows={3}
            placeholder="Series synopsis"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Poster URL</label>
          <input
            type="url"
            value={form.posterUrl}
            onChange={(e) => set("posterUrl", e.target.value)}
            className="input-field"
            placeholder="https://…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Banner / Backdrop URL</label>
          <input
            type="url"
            value={form.bannerUrl}
            onChange={(e) => set("bannerUrl", e.target.value)}
            className="input-field"
            placeholder="https://…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Trailer URL</label>
          <input
            type="url"
            value={form.trailerUrl}
            onChange={(e) => set("trailerUrl", e.target.value)}
            className="input-field"
            placeholder="Auto-filled from TMDB, or paste YouTube URL"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Total Seasons</label>
          <input
            type="number"
            min="1"
            value={form.totalSeasons}
            onChange={(e) => set("totalSeasons", e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Release Year</label>
          <input
            type="number"
            min="1888"
            max={new Date().getFullYear() + 5}
            value={form.releaseYear}
            onChange={(e) => set("releaseYear", e.target.value)}
            className="input-field"
            placeholder="e.g. 2023"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Air Status</label>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            className="input-field"
          >
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Publish Status</label>
          <select
            value={form.publishStatus}
            onChange={(e) => set("publishStatus", e.target.value)}
            className="input-field"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Rating (0–10)</label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={form.rating}
            onChange={(e) => set("rating", e.target.value)}
            className="input-field"
            placeholder="Auto-filled from TMDB, or set manually"
          />
        </div>
      </div>

      {genres.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Genres</label>
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <button
                key={g._id}
                type="button"
                onClick={() => toggleGenre(g._id)}
                className={`badge px-3 py-1 text-sm border transition ${
                  form.genres.includes(g._id)
                    ? "bg-sarrows-red/20 text-sarrows-red border-sarrows-red/30"
                    : "bg-white/5 text-gray-400 border-sarrows-border hover:bg-white/10"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <CastEditor cast={cast} onChange={setCast} />

      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
        {submitting ? "Saving…" : isEdit ? "Update Series" : "Add Web Series"}
      </button>
    </form>
  );
}
