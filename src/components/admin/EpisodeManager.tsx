"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import EpisodeForm from "./EpisodeForm";

interface Props {
  series: any;
}

export default function EpisodeManager({ series }: Props) {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/episodes?seriesId=${series._id}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to load episodes"); return; }
      setEpisodes(data.episodes || []);
    } catch {
      setError("Failed to load episodes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    setShowForm(false);
    setEditing(null);
  }, [series._id]);

  const sortEpisodes = (list: any[]) =>
    [...list].sort((a, b) => a.season - b.season || a.episodeNumber - b.episodeNumber);

  const deleteEpisode = async (id: string) => {
    if (!confirm("Delete this episode?")) return;
    const res = await fetch(`/api/admin/episodes/${id}`, { method: "DELETE" });
    if (res.ok) setEpisodes((prev) => prev.filter((e) => e._id !== id));
  };

  const nextEpisodeNumber = () => {
    const bySeason = episodes.filter((e) => e.season === (episodes[0]?.season ?? 1));
    if (episodes.length === 0) return { season: 1, episodeNumber: 1 };
    const maxSeason = Math.max(...episodes.map((e) => e.season));
    const inMaxSeason = episodes.filter((e) => e.season === maxSeason);
    const maxEp = Math.max(...inMaxSeason.map((e) => e.episodeNumber));
    return { season: maxSeason, episodeNumber: maxEp + 1 };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">{episodes.length} episode{episodes.length !== 1 ? "s" : ""}</span>
        {!showForm && !editing && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 btn-primary text-xs py-2 px-3.5"
          >
            <Plus className="w-3.5 h-3.5" /> New Episode
          </button>
        )}
      </div>

      {showForm && (
        <EpisodeForm
          seriesId={series._id}
          externalId={series.externalId}
          initial={nextEpisodeNumber()}
          onSuccess={(ep) => setEpisodes((prev) => sortEpisodes([...prev, ep]))}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editing && (
        <EpisodeForm
          seriesId={series._id}
          externalId={series.externalId}
          initial={editing}
          onSuccess={(ep) => {
            setEpisodes((prev) => sortEpisodes(prev.map((e) => (e._id === ep._id ? ep : e))));
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {loading && <p className="text-sm text-gray-500">Loading episodes...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && (
        <div className="space-y-1.5">
          {episodes.map((ep) => (
            <div
              key={ep._id}
              className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-white/[0.04]"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-none bg-white/5 text-gray-400">
                <Film className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate leading-tight">
                  S{ep.season}E{ep.episodeNumber}{ep.title ? ` · ${ep.title}` : ""}
                </p>
                <div className="flex items-center flex-wrap gap-1.5 mt-1">
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    ep.videoUrl ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                  )}>
                    {ep.videoUrl ? "Video linked" : "No video"}
                  </span>
                  {ep.videoType && ep.videoType !== "auto" && (
                    <span className="text-[10px] text-gray-600">{ep.videoType}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-none">
                <button
                  onClick={() => { setEditing(ep); setShowForm(false); }}
                  aria-label={`Edit episode ${ep.episodeNumber}`}
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteEpisode(ep._id)}
                  aria-label={`Delete episode ${ep.episodeNumber}`}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {episodes.length === 0 && (
            <div className="text-center py-10 text-gray-600 text-sm">No episodes yet — add one above.</div>
          )}
        </div>
      )}
    </div>
  );
}
