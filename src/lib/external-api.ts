"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bot, Play, Square, Trash2, RefreshCw, AlertCircle,
  CheckCircle2, Clock, Loader2, Zap, BarChart3,
  XCircle, Settings2, Film, TrendingUp, Star, CalendarDays, Flame,
  Sword, Ghost, Laugh, Crosshair, Rocket, Clapperboard, Drama,
  Heart, ShieldAlert, FileVideo, Compass, Sparkles, Search, Bomb
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface BotConfig {
  enabled: boolean;
  uploadedCount: number;
  duplicateCount: number;
  failedCount: number;
  lastActivity: string | null;
  lastError: string | null;
  lastUploadedTitle: string | null;
  startedAt: string | null;
  stoppedAt: string | null;
  sources: string[];
  currentSourceIdx: number;
  currentPage: number;
  currentMovieIdx: number;
  stopAfterMs: number | null;
  scheduledStopAt: string | null;
}

interface BotJob {
  _id: string;
  title: string;
  status: "done" | "failed" | "duplicate";
  releaseYear?: number;
  externalId?: string;
  genreNames?: string[];
  source?: string;
  aiVerified?: boolean;
  aiConfidence?: number;
  aiNotes?: string;
  aiIssues?: string[];
  aiCorrectedTitle?: string;
  error?: string;
  movieSlug?: string;
  processedAt?: string;
  createdAt: string;
}

interface StatusCounts {
  done?: number;
  failed?: number;
  duplicate?: number;
}

interface Props {
  initialConfig: BotConfig;
  initialStatusCounts: StatusCounts;
}

// ── Source config ─────────────────────────────────────────────────────────────
const ALL_SOURCES = [
  // Lists
  { id: "popular",           label: "Popular",            icon: Film,        group: "Lists" },
  { id: "trending_day",      label: "Trending Today",     icon: Flame,       group: "Lists" },
  { id: "trending_week",     label: "Trending This Week", icon: TrendingUp,  group: "Lists" },
  { id: "top_rated",         label: "Top Rated",          icon: Star,        group: "Lists" },
  { id: "now_playing",       label: "Now Playing",        icon: CalendarDays,group: "Lists" },
  { id: "upcoming",          label: "Upcoming",           icon: CalendarDays,group: "Lists" },
  // Genres
  { id: "genre_action",      label: "Action",             icon: Sword,       group: "Genres" },
  { id: "genre_adventure",   label: "Adventure",          icon: Compass,     group: "Genres" },
  { id: "genre_animation",   label: "Animation",          icon: Clapperboard,group: "Genres" },
  { id: "genre_comedy",      label: "Comedy",             icon: Laugh,       group: "Genres" },
  { id: "genre_crime",       label: "Crime",              icon: Crosshair,   group: "Genres" },
  { id: "genre_documentary", label: "Documentary",        icon: FileVideo,   group: "Genres" },
  { id: "genre_drama",       label: "Drama",              icon: Drama,       group: "Genres" },
  { id: "genre_fantasy",     label: "Fantasy",            icon: Sparkles,    group: "Genres" },
  { id: "genre_horror",      label: "Horror",             icon: Ghost,       group: "Genres" },
  { id: "genre_mystery",     label: "Mystery",            icon: Search,      group: "Genres" },
  { id: "genre_romance",     label: "Romance",            icon: Heart,       group: "Genres" },
  { id: "genre_scifi",       label: "Sci-Fi",             icon: Rocket,      group: "Genres" },
  { id: "genre_thriller",    label: "Thriller",           icon: ShieldAlert, group: "Genres" },
  { id: "genre_war",         label: "War",                icon: Bomb,        group: "Genres" },
];

const SOURCE_LABEL: Record<string, string> = Object.fromEntries(
  ALL_SOURCES.map((s) => [s.id, s.label])
);

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  done:      "bg-green-500/10 text-green-400 border-green-500/20",
  failed:    "bg-red-500/10 text-red-400 border-red-500/20",
  duplicate: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
      STATUS_STYLES[status] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20"
    )}>
      {status}
    </span>
  );
}

// ── Job Row ───────────────────────────────────────────────────────────────────
function JobRow({ job }: { job: BotJob }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        onClick={() => setOpen(o => !o)}
        className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition"
      >
        <td className="px-4 py-3 text-sm text-white font-medium max-w-[220px] truncate">
          {job.aiCorrectedTitle ? (
            <span title={`AI corrected from: ${job.title}`}>
              {job.aiCorrectedTitle}
              <span className="text-[10px] text-yellow-500 ml-1">(AI)</span>
            </span>
          ) : job.title}
        </td>
        <td className="px-3 py-3"><StatusBadge status={job.status} /></td>
        <td className="px-3 py-3 text-xs text-gray-500">
          {SOURCE_LABEL[job.source ?? ""] ?? job.source ?? "—"}
        </td>
        <td className="px-3 py-3 text-xs text-gray-500">{job.releaseYear ?? "—"}</td>
        <td className="px-3 py-3">
          {job.aiVerified ? (
            <span className="text-xs flex items-center gap-1 text-green-400">
              <CheckCircle2 className="w-3 h-3" /> {job.aiConfidence ?? 0}%
            </span>
          ) : <span className="text-xs text-gray-600">—</span>}
        </td>
        <td className="px-3 py-3 text-xs text-gray-500">
          {job.processedAt
            ? new Date(job.processedAt).toLocaleString()
            : new Date(job.createdAt).toLocaleString()}
        </td>
        <td className="px-3 py-3">
          {job.movieSlug && job.status === "done" && (
            <a
              href={`/movies/${job.movieSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-[11px] text-sarrows-red hover:underline"
            >
              View
            </a>
          )}
        </td>
      </tr>
      {open && (
        <tr className="border-b border-white/5 bg-white/[0.015]">
          <td colSpan={7} className="px-4 py-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              {job.error && (
                <div className="col-span-2 md:col-span-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{job.error}</span>
                </div>
              )}
              {job.aiNotes && (
                <div className="col-span-2 md:col-span-3 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{job.aiNotes}</span>
                </div>
              )}
              {job.aiIssues && job.aiIssues.length > 0 && (
                <div className="col-span-2 md:col-span-3">
                  <p className="text-gray-500 mb-1 font-medium">AI Issues Flagged</p>
                  <ul className="space-y-0.5">
                    {job.aiIssues.map((issue, i) => (
                      <li key={i} className="text-yellow-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div><p className="text-gray-500 mb-0.5">TMDB ID</p><p className="text-white">{job.externalId || "—"}</p></div>
              <div><p className="text-gray-500 mb-0.5">Genres</p><p className="text-white">{job.genreNames?.join(", ") || "—"}</p></div>
              {job.aiCorrectedTitle && (
                <div><p className="text-gray-500 mb-0.5">Original Title</p><p className="text-white">{job.title}</p></div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Source Settings Panel ─────────────────────────────────────────────────────
function SourceSettings({ config, onSave }: { config: BotConfig; onSave: (cfg: BotConfig) => void }) {
  const [selected, setSelected] = useState<string[]>(config.sources ?? []);
  const [saving, setSaving] = useState(false);
  const [resetCursor, setResetCursor] = useState(false);

  function toggle(id: string) {
    setSelected(s =>
      s.includes(id) ? (s.length > 1 ? s.filter(x => x !== id) : s) : [...s, id]
    );
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/bot/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources: selected, resetCursor }),
      });
      if (res.ok) onSave(await res.json());
    } finally { setSaving(false); }
  }

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-2 mb-1">
        <Settings2 className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-bold text-white">Discovery Sources</h3>
      </div>
      <p className="text-xs text-gray-500">The bot cycles through these TMDB lists automatically, uploading one movie every 10 seconds.</p>

      <div className="space-y-4">
        {(["Lists", "Genres"] as const).map((group) => (
          <div key={group}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">{group}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {ALL_SOURCES.filter((s) => s.group === group).map(({ id, label, icon: Icon }) => (
                <label key={id} className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    onClick={() => toggle(id)}
                    className={cn(
                      "w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0",
                      selected.includes(id)
                        ? "bg-sarrows-red border-sarrows-red"
                        : "border-white/20 bg-transparent"
                    )}
                  >
                    {selected.includes(id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <Icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition shrink-0" />
                  <span className="text-sm text-gray-300 group-hover:text-white transition">{label}</span>
                  {config.sources?.[config.currentSourceIdx % config.sources.length] === id && config.enabled && (
                    <span className="text-[10px] text-green-400 font-bold animate-pulse">● NOW</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <label className="flex items-center gap-2 cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={resetCursor}
          onChange={e => setResetCursor(e.target.checked)}
          className="accent-sarrows-red w-3.5 h-3.5"
        />
        <span className="text-xs text-gray-500">Reset position to start (page 1)</span>
      </label>

      <button
        onClick={save}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/8 border border-white/10 text-sm text-white hover:bg-white/12 transition disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
        Save Sources
      </button>
    </div>
  );
}

// ── History Table ─────────────────────────────────────────────────────────────
const STATUS_TABS = ["all", "done", "duplicate", "failed"] as const;

function HistoryTable({ botEnabled }: { botEnabled: boolean }) {
  const [jobs, setJobs] = useState<BotJob[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({});
  const [clearing, setClearing] = useState<string | null>(null);

  const fetch_ = useCallback(async (p = page, sf = statusFilter, q = query) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (sf !== "all") params.set("status", sf);
      if (q.trim()) params.set("q", q.trim());
      const r = await fetch(`/api/admin/bot/jobs?${params}`);
      if (r.ok) {
        const d = await r.json();
        setJobs(d.jobs);
        setTotal(d.total);
        setTotalPages(d.totalPages);
        setStatusCounts(d.statusCounts ?? {});
      }
    } finally { setLoading(false); }
  }, [page, statusFilter, query]);

  useEffect(() => { fetch_(page, statusFilter, query); }, [page, statusFilter]);

  // Auto-refresh every 5 s — only while the bot is running
  useEffect(() => {
    if (!botEnabled) return;
    const id = setInterval(() => fetch_(page, statusFilter, query), 5000);
    return () => clearInterval(id);
  }, [botEnabled, page, statusFilter, query, fetch_]);

  async function clearHistory(status?: string) {
    setClearing(status ?? "all");
    try {
      const url = status ? `/api/admin/bot/jobs?status=${status}` : "/api/admin/bot/jobs";
      await fetch(url, { method: "DELETE" });
      setPage(1);
      fetch_(1, statusFilter, query);
    } finally { setClearing(null); }
  }

  const totalCount = Object.values(statusCounts).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
      {/* Toolbar */}
      <div className="px-4 py-3 flex flex-wrap items-center gap-3" style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <form onSubmit={e => { e.preventDefault(); setPage(1); fetch_(1, statusFilter, query); }} className="flex-1 min-w-[160px] flex gap-2">
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search titles…"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-sarrows-red/40 transition"
          />
        </form>
        <div className="flex items-center gap-2">
          {["done", "duplicate", "failed"].map(s =>
            (statusCounts as any)[s] ? (
              <button key={s} onClick={() => clearHistory(s)} disabled={!!clearing} className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-red-400 hover:border-red-500/30 transition flex items-center gap-1">
                {clearing === s ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Clear {s}
              </button>
            ) : null
          )}
          {totalCount > 0 && (
            <button onClick={() => clearHistory()} disabled={!!clearing} className="text-[11px] px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition flex items-center gap-1">
              {clearing === "all" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex overflow-x-auto px-4 pt-3 gap-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {STATUS_TABS.map(tab => {
          const count = tab === "all" ? totalCount : (statusCounts as any)[tab] ?? 0;
          return (
            <button
              key={tab}
              onClick={() => { setStatusFilter(tab); setPage(1); }}
              className={cn(
                "pb-2.5 px-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5",
                statusFilter === tab ? "border-sarrows-red text-white" : "border-transparent text-gray-500 hover:text-gray-300"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {count > 0 && (
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-bold border", STATUS_STYLES[tab] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20")}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Title", "Status", "Source", "Year", "AI", "Date", ""].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              </td></tr>
            ) : jobs.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center">
                <p className="text-gray-600 text-sm">No history yet — start the bot to begin auto-uploading</p>
              </td></tr>
            ) : (
              jobs.map(job => <JobRow key={job._id} job={job} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-xs text-gray-500">{total} total</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-lg bg-white/5 text-gray-400 disabled:opacity-30 text-xs hover:bg-white/10 transition">Prev</button>
            <span className="text-xs text-gray-400">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded-lg bg-white/5 text-gray-400 disabled:opacity-30 text-xs hover:bg-white/10 transition">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Duration presets ──────────────────────────────────────────────────────────
const DURATION_PRESETS = [
  { label: "No limit",   ms: 0 },
  { label: "15 min",     ms: 15 * 60 * 1000 },
  { label: "30 min",     ms: 30 * 60 * 1000 },
  { label: "1 hour",     ms: 60 * 60 * 1000 },
  { label: "2 hours",    ms: 2 * 60 * 60 * 1000 },
  { label: "4 hours",    ms: 4 * 60 * 60 * 1000 },
  { label: "8 hours",    ms: 8 * 60 * 60 * 1000 },
  { label: "24 hours",   ms: 24 * 60 * 60 * 1000 },
];

function formatCountdown(ms: number): string {
  if (ms <= 0) return "stopping…";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BotClient({ initialConfig, initialStatusCounts }: Props) {
  const [config, setConfig] = useState<BotConfig>(initialConfig);
  const [toggling, setToggling] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [selectedDurationMs, setSelectedDurationMs] = useState<number>(0); // 0 = no limit
  const [countdown, setCountdown] = useState<number | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/bot/config");
      if (r.ok) setConfig(await r.json());
    } catch {}
  }, []);

  // Poll config every 5 s — only while the bot is running
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (!config.enabled) return;
    pollingRef.current = setInterval(fetchConfig, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [config.enabled, fetchConfig]);

  // Live countdown ticker
  useEffect(() => {
    if (!config.enabled || !config.scheduledStopAt) {
      setCountdown(null);
      return;
    }
    const tick = () => {
      const remaining = new Date(config.scheduledStopAt!).getTime() - Date.now();
      setCountdown(Math.max(0, remaining));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [config.enabled, config.scheduledStopAt]);

  async function toggleBot() {
    setToggling(true);
    try {
      const body: any = { enabled: !config.enabled };
      if (!config.enabled && selectedDurationMs > 0) body.stopAfterMs = selectedDurationMs;
      const r = await fetch("/api/admin/bot/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.ok) setConfig(await r.json());
    } finally { setToggling(false); }
  }

  async function resetStats() {
    if (!confirm("Reset all stats? This won't delete the upload history.")) return;
    setResetting(true);
    try {
      const r = await fetch("/api/admin/bot/config", { method: "DELETE" });
      if (r.ok) setConfig(await r.json());
    } finally { setResetting(false); }
  }

  const currentSource = config.sources?.[config.currentSourceIdx % (config.sources?.length || 1)];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(229,9,20,0.12)", border: "1px solid rgba(229,9,20,0.2)" }}>
            <Bot className="w-5 h-5 text-sarrows-red" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Movie Upload Bot</h1>
            <p className="text-xs text-gray-500 mt-0.5">Auto-discovers from TMDB · AI verified · 1 movie / 10s</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button onClick={resetStats} disabled={resetting} title="Reset stats" className="p-2 rounded-xl hover:bg-white/8 text-gray-500 hover:text-white transition">
            {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
          </button>
          {/* Duration picker — only visible when bot is stopped */}
          {!config.enabled && (
            <select
              value={selectedDurationMs}
              onChange={e => setSelectedDurationMs(Number(e.target.value))}
              className="text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 focus:outline-none focus:border-sarrows-red/40 transition cursor-pointer"
            >
              {DURATION_PRESETS.map(p => (
                <option key={p.ms} value={p.ms}>{p.label}</option>
              ))}
            </select>
          )}
          <button
            onClick={toggleBot}
            disabled={toggling}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              config.enabled
                ? "bg-white/8 border border-white/12 text-white hover:bg-white/12"
                : "bg-sarrows-red hover:bg-red-600 text-white"
            )}
          >
            {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> : config.enabled ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {config.enabled ? "Stop Bot" : "Start Bot"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Uploaded", value: config.uploadedCount, icon: CheckCircle2, color: "text-green-400" },
          { label: "Duplicates skipped", value: config.duplicateCount, icon: XCircle, color: "text-purple-400" },
          { label: "Failed", value: config.failedCount, icon: AlertCircle, color: "text-red-400" },
          { label: "Total processed", value: (config.uploadedCount ?? 0) + (config.duplicateCount ?? 0) + (config.failedCount ?? 0), icon: RefreshCw, color: "text-blue-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn("w-4 h-4", color)} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className="text-2xl font-black text-white">{value ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Status strip */}
      <div className={cn(
        "rounded-2xl px-5 py-3 mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs",
        config.enabled ? "border border-green-500/20 bg-green-500/5" : "border border-white/8 bg-white/2"
      )}>
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", config.enabled ? "bg-green-400 animate-pulse" : "bg-gray-600")} />
          <span className={cn("font-bold", config.enabled ? "text-green-400" : "text-gray-500")}>
            {config.enabled ? "BOT RUNNING" : "BOT STOPPED"}
          </span>
        </div>
        {config.enabled && currentSource && (
          <div className="text-gray-400 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-blue-400" />
            Now pulling: <span className="text-white font-medium">{SOURCE_LABEL[currentSource]}</span>
            <span className="text-gray-600">page {config.currentPage}, #{config.currentMovieIdx}</span>
          </div>
        )}
        {config.lastUploadedTitle && (
          <div className="text-gray-400 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-yellow-400" />
            Last uploaded: <span className="text-white font-medium">{config.lastUploadedTitle}</span>
          </div>
        )}
        {config.lastActivity && (
          <div className="text-gray-500" suppressHydrationWarning>
            {new Date(config.lastActivity).toISOString().replace("T", " ").slice(0, 19)} UTC
          </div>
        )}
        {countdown !== null && (
          <div className="flex items-center gap-1.5 text-yellow-400 font-medium">
            <Clock className="w-3 h-3 shrink-0" />
            Auto-stops in <span className="tabular-nums">{formatCountdown(countdown)}</span>
          </div>
        )}
        {config.enabled && !config.scheduledStopAt && (
          <div className="text-gray-600 flex items-center gap-1.5">
            <Clock className="w-3 h-3 shrink-0" /> No time limit
          </div>
        )}
        {config.lastError && (
          <div className="text-red-400 flex items-center gap-1.5 max-w-sm truncate">
            <AlertCircle className="w-3 h-3 shrink-0" /> {config.lastError}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: source settings */}
        <div className="lg:col-span-1">
          <SourceSettings config={config} onSave={setConfig} />
        </div>

        {/* Right: upload history */}
        <div className="lg:col-span-3">
          <div className="flex items-center gap-2 mb-3">
            <Film className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-bold text-white">Upload History</h2>
            {config.enabled && (
              <span className="text-xs text-gray-600">auto-refreshes every 5s</span>
            )}
          </div>
          <HistoryTable botEnabled={config.enabled} />
        </div>
      </div>
    </div>
  );
}
