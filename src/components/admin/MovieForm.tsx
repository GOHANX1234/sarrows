"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { resolveGenreNames } from "@/lib/genre-utils";
import CastEditor, { CastMember } from "./CastEditor";

interface Props {
  genres: any[];
  initial?: any;
  onSuccess: (movie: any) => void;
  onGenreCreated?: (genre: any) => void;
}

export default function MovieForm({ genres, initial, onSuccess, onGenreCreated }: Props) {
  const isEdit = !!initial?._id;
  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    posterUrl: initial?.posterUrl || "",
    bannerUrl: initial?.bannerUrl || "",
    trailerUrl: initial?.trailerUrl || "",
    videoUrl: initial?.videoUrl || "",
    videoType: initial?.videoType || "auto",
    externalId: initial?.externalId || "",
    duration: initial?.duration || "",
    releaseYear: initial?.releaseYear || "",
    genres: (initial?.genres?.map((g: any) => g._id || g) || []) as string[],
    status: initial?.status || "draft",
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
      const res = await fetch(`/api/admin/tmdb/search?q=${encodeURIComponent(tmdbSearch)}&type=movie`);
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
      releaseYear: result.releaseYear || prev.releaseYear,
      externalId: result.externalId || prev.externalId,
      rating: result.rating != null ? Math.round(result.rating * 10) / 10 : prev.rating,
    }));
    setTmdbResults([]);
    setTmdbSearch("");

    // Runtime and genre names are only available on TMDB's movie detail endpoint, not search.
    if (!result.externalId) return;
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/admin/tmdb/movie/${result.externalId}`);
      if (res.ok) {
        const details = await res.json();
        const genreIds = details.genreNames?.length
          ? await resolveGenreNames(details.genreNames, genres, onGenreCreated)
          : [];
        setForm((prev) => ({
          ...prev,
          duration: details.duration || prev.duration,
          genres: Array.from(new Set([...prev.genres, ...genreIds])),
        }));
        setCast(details.cast ?? []);
      }
    } catch {
      // Non-fatal: the rest of the form is already filled in from search results.
    } finally {
      setLoadingDetails(false);
    }
  };

  const set = (key: string, val: any) => setForm((p) => ({ ...p, [key]: val }));

  const toggleGenre = (id: string) => {
    setForm((p) => ({
      ...p,
      genres: p.genres.includes(id) ? p.genres.filter((g) => g !== id) : [...p.genres, id],
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        ...form,
        duration: form.duration ? parseInt(String(form.duration)) : undefined,
        releaseYear: form.releaseYear ? parseInt(String(form.releaseYear)) : undefined,
        rating: form.rating !== "" ? parseFloat(String(form.rating)) : undefined,
        cast: cast.filter((c) => c.name.trim()),
      };
      const url = isEdit ? `/api/movies/${initial._id}` : "/api/admin/movies";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      onSuccess(data.movie);
    } catch { setError("Something went wrong"); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={submit} className="bg-sarrows-card border border-sarrows-border rounded-xl p-6 space-y-5 max-w-2xl">
      {/* TMDB Search */}
      <div className="border border-sarrows-border rounded-lg p-4 bg-white/2">
        <p className="text-sm text-gray-400 mb-3 font-medium flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5" /> Auto-fill from TMDB (optional)
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={tmdbSearch}
            onChange={(e) => setTmdbSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchTMDB())}
            placeholder="Search TMDB for metadata..."
            className="input-field flex-1 py-2 text-sm"
          />
          <button type="button" onClick={searchTMDB} disabled={searching} className="btn-secondary text-sm py-2 px-4">
            <Search className="w-4 h-4" />
          </button>
        </div>
        {tmdbResults.length > 0 && (
          <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
            {tmdbResults.map((r) => (
              <button key={r.externalId} type="button" onClick={() => fillFromTMDB(r)}
                className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white transition flex items-center gap-3">
                {r.posterUrl && <img src={r.posterUrl} alt="" className="w-8 h-10 object-cover rounded" />}
                <span>{r.title} ({r.releaseYear})</span>
              </button>
            ))}
          </div>
        )}
        {loadingDetails && <p className="text-xs text-gray-500 mt-2">Fetching runtime and genres from TMDB…</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
          <input type="text" required value={form.title} onChange={(e) => set("title", e.target.value)} className="input-field" placeholder="Movie title" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="input-field h-24 resize-none" placeholder="Movie description..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Video URL (CDN) *</label>
          <input type="url" value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} className="input-field" placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Video Type</label>
          <select value={form.videoType} onChange={(e) => set("videoType", e.target.value)} className="input-field">
            <option value="auto">Auto-detect (from URL extension)</option>
            <option value="hls">HLS (.m3u8 stream)</option>
            <option value="direct">Direct file (mp4/webm)</option>
            <option value="embed">Third-party embed (iframe)</option>
          </select>
          <p className="text-[11px] text-gray-600 mt-1">
            Set this if the CDN URL has no file extension — direct/HLS links are fully proxied and hidden from viewers; embeds can't be hidden.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Poster URL</label>
          <input type="url" value={form.posterUrl} onChange={(e) => set("posterUrl", e.target.value)} className="input-field" placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Banner URL</label>
          <input type="url" value={form.bannerUrl} onChange={(e) => set("bannerUrl", e.target.value)} className="input-field" placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Trailer URL</label>
          <input type="url" value={form.trailerUrl} onChange={(e) => set("trailerUrl", e.target.value)} className="input-field" placeholder="https://youtube.com/..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Duration (seconds)</label>
          <input type="number" value={form.duration} onChange={(e) => set("duration", e.target.value)} className="input-field" placeholder="Auto-filled from TMDB, or set manually" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Release Year</label>
          <input type="number" value={form.releaseYear} onChange={(e) => set("releaseYear", e.target.value)} className="input-field" placeholder="2024" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">TMDB ID (externalId)</label>
          <input type="text" value={form.externalId} onChange={(e) => set("externalId", e.target.value)} className="input-field" placeholder="Optional" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Rating (0–10)</label>
          <input type="number" min="0" max="10" step="0.1" value={form.rating} onChange={(e) => set("rating", e.target.value)} className="input-field" placeholder="Auto-filled from TMDB, or set manually" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
          <select value={form.status} onChange={(e) => set("status", e.target.value)} className="input-field">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
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
                className={`badge px-3 py-1 text-sm border transition ${form.genres.includes(g._id) ? "bg-sarrows-red/20 text-sarrows-red border-sarrows-red/30" : "bg-white/5 text-gray-400 border-sarrows-border hover:bg-white/10"}`}
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
        {submitting ? "Saving..." : isEdit ? "Update Movie" : "Add Movie"}
      </button>
    </form>
  );
}
