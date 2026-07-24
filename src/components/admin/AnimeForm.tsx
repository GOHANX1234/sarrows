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

export default function AnimeForm({ genres, initial, onSuccess, onGenreCreated }: Props) {
  const isEdit = !!initial?._id;
  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    posterUrl: initial?.posterUrl || "",
    bannerUrl: initial?.bannerUrl || "",
    externalId: initial?.externalId || "",
    totalSeasons: initial?.totalSeasons || 1,
    releaseYear: initial?.releaseYear ?? "",
    genres: (initial?.genres?.map((g: any) => g._id || g) || []) as string[],
    status: initial?.status || "ongoing",
    publishStatus: initial?.publishStatus || "draft",
    type: initial?.type || "anime",
    rating: initial?.rating ?? "",
  });
  const [cast, setCast] = useState<CastMember[]>(initial?.cast || []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [jikanSearch, setJikanSearch] = useState("");
  const [jikanResults, setJikanResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const searchJikan = async () => {
    if (!jikanSearch.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/jikan/search?q=${encodeURIComponent(jikanSearch)}`);
      const data = await res.json();
      setJikanResults(data.results || []);
    } finally { setSearching(false); }
  };

  const fillFromJikan = async (result: any) => {
    setForm((prev) => ({
      ...prev,
      title: result.title || prev.title,
      description: result.description || prev.description,
      posterUrl: result.posterUrl || prev.posterUrl,
      bannerUrl: result.bannerUrl || prev.bannerUrl,
      externalId: result.externalId || prev.externalId,
      releaseYear: result.releaseYear ?? prev.releaseYear,
      rating: result.rating != null ? Math.round(result.rating * 10) / 10 : prev.rating,
    }));
    setJikanResults([]);
    setJikanSearch("");

    // Jikan's search response already includes genre names, so no extra fetch is needed for those.
    // Cast (voice actors/characters) requires a separate details call.
    setLoadingDetails(true);
    try {
      const tasks: Promise<void>[] = [];
      if (result.genreNames?.length) {
        tasks.push(
          resolveGenreNames(result.genreNames, genres, onGenreCreated).then((genreIds) => {
            setForm((prev) => ({ ...prev, genres: Array.from(new Set([...prev.genres, ...genreIds])) }));
          })
        );
      }
      if (result.externalId) {
        tasks.push(
          fetch(`/api/admin/jikan/anime/${result.externalId}/characters`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => setCast(data?.cast ?? []))
            .catch(() => setCast([]))
        );
      } else {
        setCast([]);
      }
      await Promise.all(tasks);
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
      const url = isEdit ? `/api/admin/series/${initial._id}` : "/api/admin/series";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          totalSeasons: parseInt(String(form.totalSeasons)),
          releaseYear: form.releaseYear !== "" ? parseInt(String(form.releaseYear)) : undefined,
          rating: form.rating !== "" ? parseFloat(String(form.rating)) : undefined,
          cast: cast.filter((c) => c.name.trim()),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      onSuccess(data.series);
    } catch { setError("Something went wrong"); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={submit} className="bg-sarrows-card border border-sarrows-border rounded-xl p-6 space-y-5 max-w-2xl">
      {/* Jikan (MyAnimeList) Search */}
      <div className="border border-sarrows-border rounded-lg p-4 bg-white/2">
        <p className="text-sm text-gray-400 mb-3 font-medium flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5" /> Auto-fill from MyAnimeList (optional)
        </p>
        <div className="flex gap-2">
          <input type="text" value={jikanSearch} onChange={(e) => setJikanSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchJikan())}
            placeholder="Search MyAnimeList..." className="input-field flex-1 py-2 text-sm" />
          <button type="button" onClick={searchJikan} disabled={searching} className="btn-secondary text-sm py-2 px-4">
            <Search className="w-4 h-4" />
          </button>
        </div>
        {jikanResults.length > 0 && (
          <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
            {jikanResults.map((r) => (
              <button key={r.externalId} type="button" onClick={() => fillFromJikan(r)}
                className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white transition flex items-center gap-3">
                {r.posterUrl && <img src={r.posterUrl} alt="" className="w-8 h-10 object-cover rounded" />}
                <span>{r.title} {r.releaseYear ? `(${r.releaseYear})` : ""}</span>
              </button>
            ))}
          </div>
        )}
        {loadingDetails && <p className="text-xs text-gray-500 mt-2">Matching genres from MyAnimeList…</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
          <input type="text" required value={form.title} onChange={(e) => set("title", e.target.value)} className="input-field" placeholder="Anime title" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="input-field h-24 resize-none" placeholder="Anime description..." />
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
          <label className="block text-sm font-medium text-gray-300 mb-1">Total Seasons</label>
          <input type="number" min="1" value={form.totalSeasons} onChange={(e) => set("totalSeasons", e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Release Year</label>
          <input type="number" min="1888" max={new Date().getFullYear() + 5} value={form.releaseYear} onChange={(e) => set("releaseYear", e.target.value)} className="input-field" placeholder="Auto-filled from MyAnimeList" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">MyAnimeList ID</label>
          <input type="text" inputMode="numeric" value={form.externalId} onChange={(e) => set("externalId", e.target.value.replace(/\D/g, ""))} className="input-field" placeholder="Auto-filled from search, or set manually" />
          <p className="text-[11px] text-gray-600 mt-1">Required for episode title autofill from MyAnimeList.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
          <select value={form.type} onChange={(e) => set("type", e.target.value)} className="input-field">
            <option value="anime">Anime</option>
            <option value="series">Series</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Air Status</label>
          <select value={form.status} onChange={(e) => set("status", e.target.value)} className="input-field">
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Publish Status</label>
          <select value={form.publishStatus} onChange={(e) => set("publishStatus", e.target.value)} className="input-field">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Rating (0–10)</label>
          <input type="number" min="0" max="10" step="0.1" value={form.rating} onChange={(e) => set("rating", e.target.value)} className="input-field" placeholder="Auto-filled from MyAnimeList, or set manually" />
        </div>
      </div>

      {genres.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Genres</label>
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <button key={g._id} type="button" onClick={() => toggleGenre(g._id)}
                className={`badge px-3 py-1 text-sm border transition ${form.genres.includes(g._id) ? "bg-sarrows-red/20 text-sarrows-red border-sarrows-red/30" : "bg-white/5 text-gray-400 border-sarrows-border hover:bg-white/10"}`}>
                {g.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <CastEditor cast={cast} onChange={setCast} />

      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
        {submitting ? "Saving..." : isEdit ? "Update Anime" : "Add Anime"}
      </button>
    </form>
  );
}
