"use client";

import { useState, useEffect } from "react";
import { Send, Trash2, Film, Tv, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = { movie: "Movie", series: "Series", anime: "Anime" };

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400",
  in_progress: "bg-blue-500/15 text-blue-400",
  fulfilled: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  fulfilled: "Fulfilled",
  rejected: "Rejected",
};

export default function RequestBox() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", type: "movie", note: "" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/requests");
      const data = await res.json();
      if (res.ok) setRequests(data.requests || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to submit request"); return; }
      setRequests((prev) => [data.request, ...prev]);
      setForm({ title: "", type: "movie", note: "" });
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Cancel this request?")) return;
    const res = await fetch(`/api/requests/${id}`, { method: "DELETE" });
    if (res.ok) setRequests((prev) => prev.filter((r) => r._id !== id));
  };

  return (
    <div className="space-y-5">
      {/* Request form */}
      <form
        onSubmit={submit}
        className="rounded-2xl p-4 sm:p-5 space-y-4"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div>
          <h2 className="text-sm font-bold text-white">Request a title</h2>
          <p className="text-xs text-gray-500 mt-0.5">Can't find something? Ask us to add it.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
            <input
              type="text"
              required
              maxLength={200}
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Attack on Titan"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className="input-field"
            >
              <option value="movie">Movie</option>
              <option value="series">Series</option>
              <option value="anime">Anime</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Note (optional)</label>
          <textarea
            value={form.note}
            maxLength={500}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            placeholder="Any details — season, year, where you saw it, etc."
            rows={2}
            className="input-field resize-none"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button type="submit" disabled={submitting} className="flex items-center gap-1.5 btn-primary text-sm disabled:opacity-50">
          <Send className="w-3.5 h-3.5" /> {submitting ? "Sending..." : "Send Request"}
        </button>
      </form>

      {/* Requests list */}
      <div>
        <p className="text-xs text-gray-500 font-medium mb-2">
          {loading ? "Loading..." : `${requests.length} request${requests.length !== 1 ? "s" : ""}`}
        </p>
        <div className="space-y-2">
          {requests.map((r) => (
            <div
              key={r._id}
              className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-white/[0.04]"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-none bg-white/5 text-gray-400">
                {r.type === "movie" ? <Film className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate leading-tight">{r.title}</p>
                <div className="flex items-center flex-wrap gap-1.5 mt-1">
                  <span className="text-[10px] text-gray-600">{TYPE_LABEL[r.type]}</span>
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", STATUS_STYLE[r.status])}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
                {r.adminNote && (
                  <p className="text-[11px] text-gray-500 mt-1 truncate">Admin: {r.adminNote}</p>
                )}
              </div>
              {r.status === "pending" && (
                <button
                  onClick={() => remove(r._id)}
                  aria-label={`Cancel request for ${r.title}`}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition flex-none"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {!loading && requests.length === 0 && (
            <div className="text-center py-12 text-gray-600 text-sm flex flex-col items-center gap-2">
              <Inbox className="w-6 h-6 text-gray-700" />
              No requests yet — ask for something above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
