"use client";

import { useState } from "react";
import { Film, Tv, Trash2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "pending" | "in_progress" | "fulfilled" | "rejected";

const TYPE_LABEL: Record<string, string> = { movie: "Movie", series: "Series", anime: "Anime" };

const STATUS_STYLE: Record<Status, string> = {
  pending: "bg-yellow-500/15 text-yellow-400",
  in_progress: "bg-blue-500/15 text-blue-400",
  fulfilled: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400",
};

const STATUS_LABEL: Record<Status, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  fulfilled: "Fulfilled",
  rejected: "Rejected",
};

const FILTERS: { key: "all" | Status; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "fulfilled", label: "Fulfilled" },
  { key: "rejected", label: "Rejected" },
];

interface Props {
  requests: any[];
}

export default function AdminRequestsClient({ requests: initial }: Props) {
  const [requests, setRequests] = useState(initial);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  const updateStatus = async (id: string, status: Status) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        setRequests((prev) => prev.map((r) => (r._id === id ? data.request : r)));
      }
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this request?")) return;
    const res = await fetch(`/api/admin/requests/${id}`, { method: "DELETE" });
    if (res.ok) setRequests((prev) => prev.filter((r) => r._id !== id));
  };

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-5 pt-2">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Requests</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {pendingCount > 0 ? `${pendingCount} pending request${pendingCount !== 1 ? "s" : ""}` : "User content requests"}
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-none",
              filter === f.key ? "bg-sarrows-red text-white" : "text-gray-400 hover:text-white hover:bg-white/[0.07]"
            )}
            style={filter === f.key ? {} : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((r) => (
          <div
            key={r._id}
            className="flex items-start sm:items-center gap-3 rounded-xl p-3.5 flex-col sm:flex-row"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-none bg-white/5 text-gray-400">
                {r.type === "movie" ? <Film className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate leading-tight">{r.title}</p>
                <div className="flex items-center flex-wrap gap-1.5 mt-1">
                  <span className="text-[10px] text-gray-600">{TYPE_LABEL[r.type]}</span>
                  <span className="text-[10px] text-gray-600">
                    by {r.user?.nickname || "unknown user"}
                  </span>
                  <span className="text-[10px] text-gray-700">
                    {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                {r.note && <p className="text-[11px] text-gray-500 mt-1">{r.note}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-none w-full sm:w-auto">
              <select
                value={r.status}
                disabled={savingId === r._id}
                onChange={(e) => updateStatus(r._id, e.target.value as Status)}
                className={cn(
                  "text-[11px] font-bold px-2 py-1.5 rounded-lg border-0 outline-none cursor-pointer disabled:opacity-50",
                  STATUS_STYLE[r.status as Status]
                )}
              >
                {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                  <option key={s} value={s} className="bg-sarrows-card text-white">
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <button
                onClick={() => remove(r._id)}
                aria-label={`Delete request for ${r.title}`}
                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-600 text-sm flex flex-col items-center gap-2">
            <Inbox className="w-6 h-6 text-gray-700" />
            No requests here.
          </div>
        )}
      </div>
    </div>
  );
}
