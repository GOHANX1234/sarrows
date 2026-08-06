"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  RotateCcw,
  Zap,
  Eye,
  Loader2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkEpisode {
  episodeNumber: number;
  season: number;
  title: string;
  videoUrl: string;
  videoType: "auto" | "hls" | "direct" | "embed";
}

interface UploadResult {
  episodeNumber: number;
  season: number;
  status: "created" | "skipped" | "error";
  error?: string;
}

interface Props {
  seriesId: string;
  seriesType?: string; // "anime" | "series"
  existingEpisodes: { season: number; episodeNumber: number }[];
  onSuccess: (episodes: any[]) => void;
  onCancel: () => void;
}

// ── Smart video type detector ────────────────────────────────────────────────
function detectVideoType(url: string): "auto" | "hls" | "direct" | "embed" {
  if (!url) return "auto";
  const lower = url.toLowerCase();
  if (lower.includes(".m3u8")) return "hls";
  if (lower.match(/\.(mp4|webm|mkv|avi|mov)(\?|$)/)) return "direct";
  // Common embed/player domains
  if (
    lower.includes("vidnest") ||
    lower.includes("streamtape") ||
    lower.includes("doodstream") ||
    lower.includes("vidcloud") ||
    lower.includes("fembed") ||
    lower.includes("voe.sx") ||
    lower.includes("mixdrop") ||
    lower.includes("iframe") ||
    lower.includes("/embed") ||
    lower.includes("/player") ||
    lower.includes("4anime") ||
    lower.includes("gogoanime") ||
    lower.includes("filemoon") ||
    lower.includes("streamlare") ||
    lower.includes("vidsrc") ||
    lower.includes("2embed")
  ) return "embed";
  return "auto";
}

// ── Smart line parser ────────────────────────────────────────────────────────
// Handles multi-line text, stripping blank lines and trimming whitespace.
function parseLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

// ── Merge titles + links into episode list ───────────────────────────────────
function buildEpisodes(
  titlesRaw: string,
  linksRaw: string,
  season: number,
  startEp: number
): BulkEpisode[] {
  const titles = parseLines(titlesRaw);
  const links  = parseLines(linksRaw);
  const count  = Math.max(titles.length, links.length);
  if (count === 0) return [];

  return Array.from({ length: count }, (_, i) => {
    const url = links[i] ?? "";
    return {
      episodeNumber: startEp + i,
      season,
      title: titles[i] ?? "",
      videoUrl: url,
      videoType: detectVideoType(url),
    };
  });
}

// Step tracker
type Step = "input" | "preview" | "uploading" | "done";

export default function BulkEpisodeUpload({
  seriesId,
  seriesType,
  existingEpisodes,
  onSuccess,
  onCancel,
}: Props) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("input");
  const [season, setSeason] = useState(1);
  const [titlesRaw, setTitlesRaw] = useState("");
  const [linksRaw, setLinksRaw] = useState("");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [summary, setSummary] = useState({ total: 0, created: 0, skipped: 0, errors: 0 });
  const [uploadedEps, setUploadedEps] = useState<any[]>([]);

  // Compute starting episode number from existing episodes
  const startEp = useMemo(() => {
    const inSeason = existingEpisodes.filter((e) => e.season === season);
    if (inSeason.length === 0) return 1;
    return Math.max(...inSeason.map((e) => e.episodeNumber)) + 1;
  }, [existingEpisodes, season]);

  // Live preview of parsed episodes
  const parsedEpisodes = useMemo(
    () => buildEpisodes(titlesRaw, linksRaw, season, startEp),
    [titlesRaw, linksRaw, season, startEp]
  );

  const titleLines = useMemo(() => parseLines(titlesRaw).length, [titlesRaw]);
  const linkLines  = useMemo(() => parseLines(linksRaw).length, [linksRaw]);

  const existingSet = useMemo(
    () => new Set(existingEpisodes.map((e) => `${e.season}:${e.episodeNumber}`)),
    [existingEpisodes]
  );

  const duplicateCount = useMemo(
    () => parsedEpisodes.filter((e) => existingSet.has(`${e.season}:${e.episodeNumber}`)).length,
    [parsedEpisodes, existingSet]
  );

  // ── Validate before preview ────────────────────────────────────────────────
  const canPreview = parsedEpisodes.length > 0 && linkLines > 0;

  // ── Upload handler ─────────────────────────────────────────────────────────
  const handleUpload = useCallback(async () => {
    setStep("uploading");
    try {
      const payload = parsedEpisodes.map((ep) => ({
        series: seriesId,
        season: ep.season,
        episodeNumber: ep.episodeNumber,
        title: ep.title || undefined,
        videoUrl: ep.videoUrl || undefined,
        videoType: ep.videoType,
      }));

      const res = await fetch("/api/admin/episodes/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodes: payload, skipDuplicates }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Fallback: show error in done state
        setResults([{ episodeNumber: 0, season, status: "error", error: data.error || "Upload failed" }]);
        setSummary({ total: parsedEpisodes.length, created: 0, skipped: 0, errors: parsedEpisodes.length });
        setStep("done");
        return;
      }
      setResults(data.results ?? []);
      setSummary(data.summary ?? { total: 0, created: 0, skipped: 0, errors: 0 });
      setUploadedEps(data.episodes ?? []);
      setStep("done");
    } catch {
      setResults([{ episodeNumber: 0, season, status: "error", error: "Network error — please try again." }]);
      setSummary({ total: parsedEpisodes.length, created: 0, skipped: 0, errors: parsedEpisodes.length });
      setStep("done");
    }
  }, [parsedEpisodes, seriesId, season, skipDuplicates]);

  const handleReset = () => {
    setStep("input");
    setTitlesRaw("");
    setLinksRaw("");
    setResults([]);
    setSummary({ total: 0, created: 0, skipped: 0, errors: 0 });
    setUploadedEps([]);
  };

  const handleDone = () => {
    if (uploadedEps.length > 0) onSuccess(uploadedEps);
    else onCancel();
  };

  // ── Render: Input step ─────────────────────────────────────────────────────
  if (step === "input") {
    return (
      <div className="space-y-5">
        {/* Header info */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-500/8 border border-blue-500/20">
          <Info className="w-4 h-4 text-blue-400 flex-none mt-0.5" />
          <div className="text-xs text-blue-300/90 leading-relaxed">
            <strong className="text-blue-300">How it works:</strong> Paste episode titles one per line in the left box, and stream links one per line in the right box. Each title matches the link on the same line. Links are auto-detected — they must start with <code className="bg-blue-500/15 px-1 rounded">https://</code>. Video type (HLS, embed, direct) is detected automatically from the URL.
          </div>
        </div>

        {/* Season + start episode row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Season</label>
            <input
              type="number"
              min="1"
              value={season}
              onChange={(e) => setSeason(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
              Start at Episode #
            </label>
            <div className="relative">
              <input
                type="number"
                value={startEp}
                readOnly
                className="input-field bg-white/[0.02] text-gray-500 cursor-not-allowed"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">auto</span>
            </div>
            <p className="text-[11px] text-gray-600 mt-1">Continues from last existing episode in this season</p>
          </div>
        </div>

        {/* Titles + Links textareas */}
        <div className="grid grid-cols-2 gap-4">
          {/* Titles */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Episode Titles</label>
              {titleLines > 0 && (
                <span className="text-[10px] text-gray-600 font-medium">{titleLines} title{titleLines !== 1 ? "s" : ""}</span>
              )}
            </div>
            <textarea
              value={titlesRaw}
              onChange={(e) => setTitlesRaw(e.target.value)}
              placeholder={"The Beginning\nThe Journey\nThe End\n...\n\n(one title per line, optional)"}
              rows={12}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-3 text-sm text-white placeholder-gray-700 outline-none focus:border-white/20 focus:bg-white/[0.06] transition resize-none font-mono leading-relaxed"
            />
          </div>

          {/* Stream Links */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Stream Links</label>
              {linkLines > 0 && (
                <span className="text-[10px] text-gray-600 font-medium">{linkLines} link{linkLines !== 1 ? "s" : ""}</span>
              )}
            </div>
            <textarea
              value={linksRaw}
              onChange={(e) => setLinksRaw(e.target.value)}
              placeholder={"https://cdn.example.com/ep1.m3u8\nhttps://cdn.example.com/ep2.m3u8\nhttps://vidnest.fun/tv/...\n...\n\n(one link per line, required)"}
              rows={12}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-3 text-sm text-white placeholder-gray-700 outline-none focus:border-white/20 focus:bg-white/[0.06] transition resize-none font-mono leading-relaxed"
            />
          </div>
        </div>

        {/* Mismatch warning */}
        {titleLines > 0 && linkLines > 0 && titleLines !== linkLines && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-yellow-500/8 border border-yellow-500/20 text-xs text-yellow-400">
            <AlertCircle className="w-4 h-4 flex-none" />
            <span>
              {titleLines > linkLines
                ? `${titleLines - linkLines} title${titleLines - linkLines > 1 ? "s" : ""} will have no link — those episodes will be created without a video URL.`
                : `${linkLines - titleLines} link${linkLines - titleLines > 1 ? "s" : ""} will have no title — those episodes will use a blank title.`
              }
            </span>
          </div>
        )}

        {/* Duplicate warning */}
        {duplicateCount > 0 && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-orange-500/8 border border-orange-500/20 text-xs text-orange-400">
            <AlertCircle className="w-4 h-4 flex-none" />
            <span>
              {duplicateCount} episode{duplicateCount > 1 ? "s" : ""} already exist{duplicateCount === 1 ? "s" : ""} in Season {season}.{" "}
              {skipDuplicates ? "They will be skipped." : "They will fail with a conflict error."}
            </span>
          </div>
        )}

        {/* Skip duplicates toggle */}
        <label className="flex items-center gap-2.5 cursor-pointer group w-fit">
          <div
            onClick={() => setSkipDuplicates((p) => !p)}
            className={cn(
              "w-9 h-5 rounded-full relative transition-colors flex-none",
              skipDuplicates ? "bg-sarrows-red" : "bg-white/10"
            )}
          >
            <span className={cn(
              "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
              skipDuplicates ? "translate-x-4" : "translate-x-0.5"
            )} />
          </div>
          <span className="text-xs text-gray-400 group-hover:text-gray-300 transition select-none">
            Skip duplicate episodes silently
          </span>
        </label>

        {/* Live count indicator */}
        {parsedEpisodes.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Zap className="w-3.5 h-3.5 text-sarrows-red" />
            <span>
              Ready to upload <strong className="text-white">{parsedEpisodes.length}</strong> episode{parsedEpisodes.length !== 1 ? "s" : ""} starting at S{season}E{startEp}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setStep("preview")}
            disabled={!canPreview}
            className="flex items-center gap-2 btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Eye className="w-4 h-4" />
            Preview {parsedEpisodes.length > 0 ? `${parsedEpisodes.length} Episodes` : "Episodes"}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Preview step ───────────────────────────────────────────────────
  if (step === "preview") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Preview — {parsedEpisodes.length} Episodes</h3>
            <p className="text-xs text-gray-500 mt-0.5">Review before uploading. Season {season}, starting at episode {startEp}.</p>
          </div>
          <button
            type="button"
            onClick={() => setStep("input")}
            className="text-xs text-gray-500 hover:text-white transition flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Edit
          </button>
        </div>

        {/* Preview table */}
        <div
          className="rounded-xl overflow-hidden border"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          {/* Table header */}
          <div
            className="grid text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3.5 py-2.5"
            style={{
              gridTemplateColumns: "3rem 1fr 1fr 3.5rem",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <span>Ep</span>
            <span>Title</span>
            <span>Link</span>
            <span>Type</span>
          </div>

          {/* Rows */}
          <div style={{ maxHeight: "340px", overflowY: "auto" }}>
            {parsedEpisodes.map((ep) => {
              const isDupe = existingSet.has(`${ep.season}:${ep.episodeNumber}`);
              return (
                <div
                  key={ep.episodeNumber}
                  className={cn(
                    "grid items-center px-3.5 py-2.5 text-xs gap-2",
                    isDupe && "opacity-50"
                  )}
                  style={{ gridTemplateColumns: "3rem 1fr 1fr 3.5rem" }}
                >
                  <span className="font-mono font-bold text-gray-400">
                    E{String(ep.episodeNumber).padStart(2, "0")}
                    {isDupe && <span className="ml-1 text-[9px] text-orange-400 font-bold">DUP</span>}
                  </span>
                  <span className={cn("truncate", ep.title ? "text-white" : "text-gray-600 italic")}>
                    {ep.title || "—"}
                  </span>
                  <span className={cn("truncate font-mono", ep.videoUrl ? "text-blue-400" : "text-red-400/70 italic")}>
                    {ep.videoUrl ? ep.videoUrl.replace(/^https?:\/\//, "").substring(0, 40) + (ep.videoUrl.length > 47 ? "…" : "") : "no link"}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full w-fit",
                    ep.videoType === "hls"    ? "bg-purple-500/15 text-purple-400" :
                    ep.videoType === "embed"  ? "bg-blue-500/15 text-blue-400" :
                    ep.videoType === "direct" ? "bg-green-500/15 text-green-400" :
                                                "bg-white/8 text-gray-500"
                  )}>
                    {ep.videoType}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-white/5 text-gray-400">
            <strong className="text-white">{parsedEpisodes.length}</strong> total
          </span>
          {duplicateCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400">
              <strong>{duplicateCount}</strong> duplicate{duplicateCount > 1 ? "s" : ""} {skipDuplicates ? "(will skip)" : "(will error)"}
            </span>
          )}
          {parsedEpisodes.filter((e) => !e.videoUrl).length > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400">
              <strong>{parsedEpisodes.filter((e) => !e.videoUrl).length}</strong> without link
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleUpload}
            className="flex items-center gap-2 btn-primary"
          >
            <Upload className="w-4 h-4" />
            Upload {parsedEpisodes.length} Episodes
          </button>
          <button type="button" onClick={() => setStep("input")} className="btn-secondary">
            Back
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Uploading ──────────────────────────────────────────────────────
  if (step === "uploading") {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-sarrows-red/10 flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-sarrows-red animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-white font-semibold">Uploading {parsedEpisodes.length} episodes…</p>
          <p className="text-gray-500 text-sm mt-1">This may take a moment</p>
        </div>
      </div>
    );
  }

  // ── Render: Done ───────────────────────────────────────────────────────────
  if (step === "done") {
    const allGood = summary.errors === 0;
    const hasErrors = summary.errors > 0;

    return (
      <div className="space-y-5">
        {/* Result header */}
        <div className="flex items-start gap-3 p-4 rounded-xl border" style={{
          background: allGood ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
          borderColor: allGood ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"
        }}>
          {allGood
            ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-none mt-0.5" />
            : <XCircle className="w-5 h-5 text-red-400 flex-none mt-0.5" />
          }
          <div>
            <p className={cn("font-bold text-sm", allGood ? "text-emerald-400" : "text-red-400")}>
              {allGood ? "Upload complete!" : "Completed with some errors"}
            </p>
            <div className="flex flex-wrap gap-3 mt-1.5 text-xs">
              {summary.created > 0 && (
                <span className="text-emerald-400"><strong>{summary.created}</strong> created</span>
              )}
              {summary.skipped > 0 && (
                <span className="text-yellow-400"><strong>{summary.skipped}</strong> skipped (duplicates)</span>
              )}
              {summary.errors > 0 && (
                <span className="text-red-400"><strong>{summary.errors}</strong> failed</span>
              )}
            </div>
          </div>
        </div>

        {/* Per-episode results (show errors + skipped) */}
        {results.filter((r) => r.status !== "created").length > 0 && (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="px-3.5 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              Non-created episodes
            </div>
            <div style={{ maxHeight: "240px", overflowY: "auto" }}>
              {results
                .filter((r) => r.status !== "created")
                .map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 text-xs">
                    {r.status === "skipped"
                      ? <AlertCircle className="w-3.5 h-3.5 text-yellow-400 flex-none" />
                      : <XCircle className="w-3.5 h-3.5 text-red-400 flex-none" />
                    }
                    <span className="text-gray-400 font-mono w-14 flex-none">S{r.season}E{String(r.episodeNumber).padStart(2, "0")}</span>
                    <span className={r.status === "skipped" ? "text-yellow-400" : "text-red-400"}>
                      {r.error ?? r.status}
                    </span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button type="button" onClick={handleDone} className="btn-primary flex items-center gap-2">
            <ChevronRight className="w-4 h-4" />
            Done
          </button>
          {summary.errors > 0 && (
            <button type="button" onClick={handleReset} className="btn-secondary flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5" />
              Upload More
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
