"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";

interface Props {
  seriesId: string;
  externalId?: string;
  seriesTitle?: string;
  animeSaltUrl?: string;
  seriesType?: string; // "anime" | "series"
  initial?: any;
  onSuccess: (episode: any) => void;
  onCancel?: () => void;
}

function buildVideoUrl(externalId: string, season: number, ep: number) {
  return `https://vidnest.fun/tv/${externalId}/${season}/${ep}`;
}

export default function EpisodeForm({ seriesId, externalId, seriesTitle, animeSaltUrl, seriesType, initial, onSuccess, onCancel }: Props) {
  const isEdit     = !!initial?._id;
  const isWebSeries = seriesType === "series";

  const [form, setForm] = useState({
    season:        initial?.season        ?? 1,
    episodeNumber: initial?.episodeNumber ?? 1,
    title:         initial?.title         ?? "",
    videoUrl:      initial?.videoUrl      ?? "",
    videoType:     initial?.videoType     ?? "auto",
  });

  const [submitting,    setSubmitting]    = useState(false);
  const [fetchingTitle, setFetchingTitle] = useState(false);
  const [fetchingVideo, setFetchingVideo] = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState("");

  const set = (key: string, val: any) => setForm((p) => ({ ...p, [key]: val }));

  const findTMDBSeriesId = async () => {
    if (!seriesTitle?.trim()) return null;
    const searchRes = await fetch(
      `/api/admin/tmdb/search?type=tv&q=${encodeURIComponent(seriesTitle.trim())}`
    );
    const searchData = await searchRes.json();
    const results = Array.isArray(searchData.results) ? searchData.results : [];
    const normalizedTitle = seriesTitle.trim().toLowerCase();
    const exactMatch = results.find(
      (result: any) => String(result.title || "").trim().toLowerCase() === normalizedTitle
    );
    return exactMatch?.externalId || results[0]?.externalId || null;
  };

  // ── Auto-fill button (web series) ────────────────────────────────────────
  // Fills video URL + fetches episode title from TMDB. Older web-series
  // records may not have an externalId, so resolve it from the series title.
  const autoFill = async () => {
    const season = parseInt(String(form.season)) || 1;
    const ep     = parseInt(String(form.episodeNumber)) || 1;
    let resolvedExternalId = externalId?.trim();

    setFetchingTitle(true);
    setError("");

    try {
      if (!resolvedExternalId) resolvedExternalId = await findTMDBSeriesId();

      if (!resolvedExternalId) {
        setError("No TMDB match found. Edit this web series and select it from TMDB first.");
        return;
      }

      // Video URL is pure string construction — instant.
      setForm((p) => ({
        ...p,
        videoUrl: buildVideoUrl(resolvedExternalId!, season, ep),
        videoType: "embed",
      }));

      // Title comes from TMDB.
      const res = await fetch(
        `/api/admin/tmdb/tv/${resolvedExternalId}/episodes/${ep}?season=${season}`
      );
      const data = await res.json();
      if (res.ok && data.title) {
        setForm((p) => ({ ...p, title: data.title }));
      } else {
        setError("No title found on TMDB — fill it in manually.");
      }
    } catch {
      setError("Couldn't reach TMDB — video URL is filled, add title manually.");
    } finally {
      setFetchingTitle(false);
    }
  };

  // ── TMDB title fetch (anime) ──────────────────────────────────────────────
  // Anime externalId is an AniList/MyAnimeList ID, so resolve the separate
  // TMDB TV ID by title before requesting the episode details.
  const fetchAnimeTitleFromTMDB = async () => {
    setFetchingTitle(true);
    setError("");
    try {
      const tmdbId = await findTMDBSeriesId();
      if (!tmdbId) {
        setError("No TMDB match found for this anime — enter the title manually.");
        return;
      }

      const season = parseInt(String(form.season)) || 1;
      const episode = parseInt(String(form.episodeNumber)) || 1;
      const res = await fetch(
        `/api/admin/tmdb/tv/${tmdbId}/episodes/${episode}?season=${season}`
      );
      const data = await res.json();
      if (res.ok && data.title) set("title", data.title);
      else setError("No title found on TMDB for this episode — enter it manually.");
    } catch {
      setError("Couldn't reach TMDB — enter the episode title manually.");
    } finally {
      setFetchingTitle(false);
    }
  };

  const fetchAnimeVideoFromAnimeSalt = async () => {
    setFetchingVideo(true);
    setError("");
    try {
      const season = parseInt(String(form.season)) || 1;
      const episode = parseInt(String(form.episodeNumber)) || 1;
      const res = await fetch("/api/admin/animesalt/episode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: seriesTitle,
          animeSaltUrl,
          season,
          episode,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.videoUrl) {
        setError(data.error || "No AnimeSalt video was found for this episode.");
        return;
      }
      setForm((p) => ({ ...p, videoUrl: data.videoUrl, videoType: "embed" }));
    } catch {
      setError("Couldn't reach AnimeSalt — enter the video URL manually.");
    } finally {
      setFetchingVideo(false);
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const url = isEdit ? `/api/admin/episodes/${initial._id}` : "/api/admin/episodes";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          series:        seriesId,
          season:        parseInt(String(form.season)),
          episodeNumber: parseInt(String(form.episodeNumber)),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      const saved = data.episode;

      if (isEdit) {
        setSuccess("Episode updated!");
        onSuccess(saved);
      } else {
        setSuccess(`Episode ${form.episodeNumber} added!`);
        onSuccess(saved);
        // Advance to next episode and reset fields.
        setForm((p) => ({
          ...p,
          episodeNumber: (parseInt(String(p.episodeNumber)) || 1) + 1,
          title:    "",
          videoUrl: "",
          videoType:"auto",
        }));
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <form onSubmit={submit} className="bg-sarrows-card border border-sarrows-border rounded-xl p-6 space-y-4 max-w-xl">

      {/* Season + Episode row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Season</label>
          <input
            type="number" min="1"
            value={form.season}
            onChange={(e) => set("season", e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Episode #</label>
          <input
            type="number" min="1" required
            value={form.episodeNumber}
            onChange={(e) => set("episodeNumber", e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      {/* Auto-fill button (web series only) */}
      {isWebSeries && (
        <button
          type="button"
          onClick={autoFill}
          disabled={fetchingTitle}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-sarrows-red/40 bg-sarrows-red/10 text-sarrows-red text-sm font-medium hover:bg-sarrows-red/20 transition disabled:opacity-50"
        >
          <Wand2 className="w-4 h-4" />
          {fetchingTitle ? "Fetching from TMDB…" : "Auto-fill Title & Video URL from TMDB"}
        </button>
      )}

      {!isWebSeries && (
        <button
          type="button"
          onClick={fetchAnimeVideoFromAnimeSalt}
          disabled={fetchingVideo}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-sarrows-red/40 bg-sarrows-red/10 text-sarrows-red text-sm font-medium hover:bg-sarrows-red/20 transition disabled:opacity-50"
        >
          {fetchingVideo ? "Fetching AnimeSalt video…" : "Auto-fill Video URL from AnimeSalt"}
        </button>
      )}

      {/* Episode Title */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Episode Title (optional)</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="input-field flex-1"
            placeholder="Episode title"
          />
          {/* Anime: resolve the AniList title to a TMDB TV series and fetch its episode title */}
          {!isWebSeries && (
            <button
              type="button"
              onClick={fetchAnimeTitleFromTMDB}
              disabled={fetchingTitle}
              className="btn-secondary text-xs whitespace-nowrap disabled:opacity-50"
            >
              {fetchingTitle ? "Fetching…" : "Fetch from TMDB"}
            </button>
          )}
        </div>
        {!isWebSeries && (
          <p className="text-[11px] text-gray-600 mt-1">
            TMDB title lookup uses the anime name and selected season/episode number.
          </p>
        )}
      </div>

      {/* Video URL */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Video URL (CDN) *</label>
        <input
          type="url" required
          value={form.videoUrl}
          onChange={(e) => set("videoUrl", e.target.value)}
          className="input-field"
          placeholder="https://..."
        />
      </div>

      {/* Video Type */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Video Type</label>
        <select value={form.videoType} onChange={(e) => set("videoType", e.target.value)} className="input-field">
          <option value="auto">Auto-detect (from URL extension)</option>
          <option value="hls">HLS (.m3u8 stream)</option>
          <option value="direct">Direct file (mp4/webm)</option>
          <option value="embed">Third-party embed (iframe)</option>
        </select>
        <p className="text-[11px] text-gray-600 mt-1">
          Direct/HLS links are fully proxied and hidden from viewers; embeds can't be hidden.
        </p>
      </div>

      {error   && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">{success}</p>}

      <div className="flex items-center gap-2">
        <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
          {submitting ? (isEdit ? "Saving..." : "Adding...") : isEdit ? "Save Changes" : "Add Episode"}
        </button>
        {isEdit && onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        )}
      </div>
    </form>
  );
}
