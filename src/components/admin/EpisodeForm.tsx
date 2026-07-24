"use client";

import { useState, useEffect } from "react";

interface Props {
  seriesId: string;
  externalId?: string;
  initial?: any;
  onSuccess: (episode: any) => void;
  onCancel?: () => void;
}

export default function EpisodeForm({ seriesId, externalId, initial, onSuccess, onCancel }: Props) {
  const isEdit = !!initial?._id;
  const [form, setForm] = useState({
    season: initial?.season ?? 1,
    episodeNumber: initial?.episodeNumber ?? 1,
    title: initial?.title ?? "",
    videoUrl: initial?.videoUrl ?? "",
    videoType: initial?.videoType ?? "auto",
  });
  const [submitting, setSubmitting] = useState(false);
  const [fetchingTitle, setFetchingTitle] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setForm({
      season: initial?.season ?? 1,
      episodeNumber: initial?.episodeNumber ?? 1,
      title: initial?.title ?? "",
      videoUrl: initial?.videoUrl ?? "",
      videoType: initial?.videoType ?? "auto",
    });
  }, [initial]);

  const set = (key: string, val: any) => setForm((p) => ({ ...p, [key]: val }));

  const fetchTitleFromMAL = async () => {
    if (!externalId || !form.episodeNumber) return;
    setFetchingTitle(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/jikan/anime/${externalId}/episodes/${form.episodeNumber}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to fetch title"); return; }
      if (data.title) set("title", data.title);
      else setError("No title found on MyAnimeList for this episode number");
    } catch { setError("Something went wrong fetching the title"); }
    finally { setFetchingTitle(false); }
  };

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
          series: seriesId,
          season: parseInt(String(form.season)),
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
        setForm((p) => ({ ...p, episodeNumber: p.episodeNumber + 1, title: "", videoUrl: "", videoType: "auto" }));
      }
    } catch { setError("Something went wrong"); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={submit} className="bg-sarrows-card border border-sarrows-border rounded-xl p-6 space-y-4 max-w-xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Season</label>
          <input type="number" min="1" value={form.season} onChange={(e) => set("season", e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Episode #</label>
          <input type="number" min="1" required value={form.episodeNumber} onChange={(e) => set("episodeNumber", e.target.value)} className="input-field" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Episode Title (optional)</label>
        <div className="flex gap-2">
          <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} className="input-field flex-1" placeholder="Episode title" />
          {externalId && (
            <button
              type="button"
              onClick={fetchTitleFromMAL}
              disabled={fetchingTitle || !form.episodeNumber}
              className="btn-secondary text-xs whitespace-nowrap disabled:opacity-50"
            >
              {fetchingTitle ? "Fetching..." : "Fetch from MAL"}
            </button>
          )}
        </div>
        {!externalId && (
          <p className="text-[11px] text-gray-600 mt-1">
            Title autofill from MyAnimeList is unavailable — this title has no linked MAL id.
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Video URL (CDN) *</label>
        <input type="url" required value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} className="input-field" placeholder="https://..." />
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
          Set this if the CDN URL has no file extension — direct/HLS links are fully proxied and hidden from viewers.
        </p>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">{success}</p>}
      <div className="flex items-center gap-2">
        <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
          {submitting ? (isEdit ? "Saving..." : "Adding...") : isEdit ? "Save Changes" : "Add Episode"}
        </button>
        {isEdit && onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
