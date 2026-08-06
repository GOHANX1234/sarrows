"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Smartphone, Plus, Trash2, Edit2, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Zap, Shield, AlertTriangle, RefreshCw,
  Copy, Check, Radio
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppVersionDoc {
  _id: string;
  versionName: string;
  versionCode: number;
  platform: "android" | "ios" | "all";
  channel: "stable" | "beta";
  downloadUrl: string;
  releaseNotes: string;
  forceUpdate: boolean;
  minSupportedVersionCode: number;
  rolloutPercentage: number;
  isActive: boolean;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM = {
  versionName: "",
  versionCode: "",
  platform: "android" as "android" | "ios" | "all",
  channel: "stable" as "stable" | "beta",
  downloadUrl: "",
  releaseNotes: "",
  forceUpdate: false,
  minSupportedVersionCode: "1",
  rolloutPercentage: "100",
  isActive: true,
  adminNotes: "",
};

type FormState = typeof EMPTY_FORM;

function platformIcon(p: string) {
  if (p === "ios") return "🍎";
  if (p === "android") return "🤖";
  return "📱";
}

function platformLabel(p: string) {
  if (p === "ios") return "iOS";
  if (p === "android") return "Android";
  return "All";
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={handleCopy} className="ml-1.5 text-gray-600 hover:text-gray-300 transition" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function VersionRow({
  v,
  onToggleActive,
  onToggleForce,
  onDelete,
  onEdit,
  isPending,
}: {
  v: AppVersionDoc;
  onToggleActive: (id: string, val: boolean) => void;
  onToggleForce: (id: string, val: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (v: AppVersionDoc) => void;
  isPending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: v.isActive ? "rgba(229,9,20,0.05)" : "rgba(255,255,255,0.025)",
        border: v.isActive ? "1px solid rgba(229,9,20,0.2)" : "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3.5 flex-wrap">
        {/* Version info */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-none"
            style={{ background: "rgba(0,0,0,0.35)" }}
          >
            {platformIcon(v.platform)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-bold text-sm">{v.versionName}</span>
              <span className="text-[10px] font-mono text-gray-500">#{v.versionCode}</span>
              {v.isActive && (
                <span
                  className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(229,9,20,0.15)", color: "#f87171", border: "1px solid rgba(229,9,20,0.3)" }}
                >
                  Live
                </span>
              )}
              {v.channel === "beta" && (
                <span
                  className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.3)" }}
                >
                  Beta
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[11px] text-gray-500">{platformLabel(v.platform)}</span>
              <span className="text-gray-700 text-[11px]">·</span>
              <span className="text-[11px] text-gray-500">
                Rollout: <span className="text-gray-300">{v.rolloutPercentage}%</span>
              </span>
              <span className="text-gray-700 text-[11px]">·</span>
              <span className="text-[11px] text-gray-500">
                Min: <span className="text-gray-300">#{v.minSupportedVersionCode}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-none">
          {v.isActive && v.forceUpdate && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide"
              style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              <Zap className="w-3 h-3" /> Force
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-none">
          <button
            onClick={() => onToggleActive(v._id, !v.isActive)}
            disabled={isPending}
            title={v.isActive ? "Deactivate (set draft)" : "Activate (set live)"}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              v.isActive
                ? "text-emerald-400 hover:bg-emerald-400/10"
                : "text-gray-600 hover:text-emerald-400 hover:bg-emerald-400/10"
            )}
          >
            {v.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onEdit(v)}
            disabled={isPending}
            title="Edit"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            title="Details"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDelete(v._id)}
            disabled={isPending}
            title="Delete"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div
          className="px-4 pb-4 pt-1 space-y-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* Download URL */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">Download URL</p>
            <div className="flex items-center gap-1">
              <p className="text-xs text-gray-300 font-mono truncate max-w-xs">{v.downloadUrl}</p>
              <CopyButton text={v.downloadUrl} />
            </div>
          </div>

          {/* Release notes */}
          {v.releaseNotes && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">Release Notes</p>
              <p className="text-xs text-gray-400 whitespace-pre-wrap leading-relaxed">{v.releaseNotes}</p>
            </div>
          )}

          {/* Admin notes */}
          {v.adminNotes && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-1">Admin Notes</p>
              <p className="text-xs text-gray-500 whitespace-pre-wrap">{v.adminNotes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="flex gap-4 flex-wrap">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-600">Created</p>
              <p className="text-xs text-gray-400">{new Date(v.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-600">Updated</p>
              <p className="text-xs text-gray-400">{new Date(v.updatedAt).toLocaleString()}</p>
            </div>
          </div>

          {/* Force update toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleForce(v._id, !v.forceUpdate)}
              disabled={isPending}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                v.forceUpdate
                  ? "text-red-400 hover:bg-red-400/10"
                  : "text-gray-500 hover:text-white hover:bg-white/8"
              )}
              style={{ border: v.forceUpdate ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.08)" }}
            >
              <Zap className="w-3.5 h-3.5" />
              {v.forceUpdate ? "Force update ON" : "Force update OFF"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function VersionForm({
  form,
  onChange,
  onSubmit,
  submitting,
  onCancel,
  editMode,
}: {
  form: FormState;
  onChange: (f: Partial<FormState>) => void;
  onSubmit: () => void;
  submitting: boolean;
  onCancel?: () => void;
  editMode?: boolean;
}) {
  const field = (
    label: string,
    key: keyof FormState,
    type: "text" | "number" | "textarea" | "url" = "text",
    placeholder?: string
  ) => (
    <div>
      <label className="block text-[11px] uppercase tracking-widest text-gray-500 mb-1.5">{label}</label>
      {type === "textarea" ? (
        <textarea
          rows={4}
          placeholder={placeholder}
          value={form[key] as string}
          onChange={(e) => onChange({ [key]: e.target.value } as any)}
          className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 resize-none outline-none transition focus:ring-1 focus:ring-sarrows-red/50"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={form[key] as string | number}
          onChange={(e) => onChange({ [key]: e.target.value } as any)}
          className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition focus:ring-1 focus:ring-sarrows-red/50"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
        />
      )}
    </div>
  );

  const select = (label: string, key: keyof FormState, options: { value: string; label: string }[]) => (
    <div>
      <label className="block text-[11px] uppercase tracking-widest text-gray-500 mb-1.5">{label}</label>
      <select
        value={form[key] as string}
        onChange={(e) => onChange({ [key]: e.target.value } as any)}
        className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition focus:ring-1 focus:ring-sarrows-red/50 appearance-none"
        style={{ background: "rgba(20,20,28,0.9)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );

  const toggle = (label: string, sub: string, key: keyof FormState, icon: React.ReactNode, accent = "red") => {
    const val = form[key] as boolean;
    const colors: Record<string, string> = {
      red: "rgba(229,9,20,0.15)",
      orange: "rgba(251,146,60,0.15)",
    };
    const borders: Record<string, string> = {
      red: "rgba(229,9,20,0.3)",
      orange: "rgba(251,146,60,0.3)",
    };
    return (
      <button
        type="button"
        onClick={() => onChange({ [key]: !val } as any)}
        className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-left transition-all"
        style={{
          background: val ? colors[accent] : "rgba(255,255,255,0.03)",
          border: `1px solid ${val ? borders[accent] : "rgba(255,255,255,0.08)"}`,
        }}
      >
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-none transition-colors",
            val ? "text-sarrows-red" : "text-gray-600"
          )}
          style={{ background: "rgba(0,0,0,0.3)" }}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>
        </div>
        <div
          className={cn(
            "ml-auto w-10 h-5 rounded-full transition-all relative flex-none",
            val ? "bg-sarrows-red" : "bg-gray-700"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
              val ? "left-[22px]" : "left-0.5"
            )}
          />
        </div>
      </button>
    );
  };

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
        {editMode ? "Edit Version" : "New Version"}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field("Version Name", "versionName", "text", "e.g. 1.2.3")}
        {editMode
          ? (
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-gray-500 mb-1.5">Version Code</label>
              <div
                className="w-full rounded-xl px-3.5 py-2.5 text-sm text-gray-600 cursor-not-allowed"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                #{form.versionCode} (cannot change)
              </div>
            </div>
          )
          : field("Version Code", "versionCode", "number", "e.g. 12 (integer, always increment)")}
        {select("Platform", "platform", [
          { value: "android", label: "🤖 Android" },
          { value: "ios", label: "🍎 iOS" },
          { value: "all", label: "📱 All Platforms" },
        ])}
        {select("Channel", "channel", [
          { value: "stable", label: "Stable (all users)" },
          { value: "beta", label: "Beta (opted-in users)" },
        ])}
      </div>

      {field("Download URL", "downloadUrl", "url", "https://cdn.example.com/app-1.2.3.apk")}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field("Rollout %", "rolloutPercentage", "number", "100")}
        {field("Min Supported Version Code", "minSupportedVersionCode", "number", "1")}
      </div>

      {field("Release Notes", "releaseNotes", "textarea", "What's new in this release...")}
      {field("Admin Notes (internal only)", "adminNotes", "textarea", "Internal notes, not sent to app...")}

      <div className="space-y-2.5">
        {toggle(
          "Force Update",
          "User must update before continuing to use the app",
          "forceUpdate",
          <Zap className="w-4 h-4" />,
          "red"
        )}
        {toggle(
          "Set as Active (Live)",
          "This version will be returned by the update check API",
          "isActive",
          <Radio className="w-4 h-4" />,
          "orange"
        )}
      </div>

      <div className="flex gap-2.5 pt-1">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #e50914 0%, #b0060f 100%)" }}
        >
          {submitting ? "Saving…" : editMode ? "Save Changes" : "Create Version"}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-all hover:bg-white/8"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default function AppUpdatesClient({ initialVersions }: { initialVersions: AppVersionDoc[] }) {
  const [versions, setVersions] = useState<AppVersionDoc[]>(initialVersions);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<AppVersionDoc | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Helpers ──────────────────────────────────────────────────────────────

  function flash(msg: string, type: "ok" | "err") {
    if (type === "ok") { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); }
    else { setError(msg); setTimeout(() => setError(""), 4000); }
  }

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError("");
  }

  function openEdit(v: AppVersionDoc) {
    setEditTarget(v);
    setForm({
      versionName: v.versionName,
      versionCode: String(v.versionCode),
      platform: v.platform,
      channel: v.channel,
      downloadUrl: v.downloadUrl,
      releaseNotes: v.releaseNotes,
      forceUpdate: v.forceUpdate,
      minSupportedVersionCode: String(v.minSupportedVersionCode),
      rolloutPercentage: String(v.rolloutPercentage),
      isActive: v.isActive,
      adminNotes: v.adminNotes,
    });
    setShowForm(true);
    setError("");
  }

  async function handleSubmit() {
    setError("");
    const payload = {
      versionName: form.versionName.trim(),
      versionCode: parseInt(form.versionCode as string),
      platform: form.platform,
      channel: form.channel,
      downloadUrl: form.downloadUrl.trim(),
      releaseNotes: form.releaseNotes,
      forceUpdate: form.forceUpdate,
      minSupportedVersionCode: parseInt(form.minSupportedVersionCode as string) || 1,
      rolloutPercentage: Math.min(100, Math.max(0, parseInt(form.rolloutPercentage as string) || 100)),
      isActive: form.isActive,
      adminNotes: form.adminNotes,
    };

    if (!payload.versionName) return setError("Version name is required");
    if (!Number.isInteger(payload.versionCode) || payload.versionCode < 1)
      return setError("Version code must be a positive integer");
    if (!payload.downloadUrl) return setError("Download URL is required");

    setSubmitting(true);
    try {
      let res: Response;
      if (editTarget) {
        const { versionCode: _vc, ...patchPayload } = payload;
        res = await fetch(`/api/admin/app-versions/${editTarget._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchPayload),
        });
      } else {
        res = await fetch("/api/admin/app-versions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Failed to save");

      if (editTarget) {
        setVersions((prev) => prev.map((v) => v._id === editTarget._id ? data.version : v));
        flash("Version updated", "ok");
      } else {
        setVersions((prev) => [data.version, ...prev]);
        flash("Version created", "ok");
      }
      setShowForm(false);
      setEditTarget(null);
      setForm(EMPTY_FORM);
    } catch {
      setError("Network error — try again");
    } finally {
      setSubmitting(false);
    }
  }

  function handleToggleActive(id: string, val: boolean) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/app-versions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: val }),
      });
      const data = await res.json();
      if (!res.ok) return flash(data.error || "Failed", "err");
      // Refresh full list to pick up any deactivations of siblings
      const listRes = await fetch("/api/admin/app-versions?limit=100");
      const listData = await listRes.json();
      if (listRes.ok) setVersions(listData.versions);
      flash(val ? "Set as active" : "Deactivated", "ok");
    });
  }

  function handleToggleForce(id: string, val: boolean) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/app-versions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceUpdate: val }),
      });
      const data = await res.json();
      if (!res.ok) return flash(data.error || "Failed", "err");
      setVersions((prev) => prev.map((v) => v._id === id ? { ...v, forceUpdate: val } : v));
      flash(val ? "Force update enabled" : "Force update disabled", "ok");
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this version record? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/app-versions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        return flash(data.error || "Failed to delete", "err");
      }
      setVersions((prev) => prev.filter((v) => v._id !== id));
      flash("Version deleted", "ok");
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const activeCount = versions.filter((v) => v.isActive).length;

  // Avoid hydration mismatch: start with the relative path (rendered by both
  // server and client), then update to the full origin URL after mount.
  const [endpointUrl, setEndpointUrl] = useState("/api/app/version/check");
  useEffect(() => {
    setEndpointUrl(`${window.location.origin}/api/app/version/check`);
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 pt-2 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Smartphone className="w-7 h-7 text-sarrows-red" />
            App Updates
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            OTA version control for the native app
            {versions.length > 0 && (
              <span className="ml-2 text-gray-600">
                · {versions.length} version{versions.length !== 1 ? "s" : ""}
                {activeCount > 0 && `, ${activeCount} live`}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #e50914 0%, #b0060f 100%)" }}
        >
          <Plus className="w-4 h-4" /> New Version
        </button>
      </div>

      {/* Flash messages */}
      {success && (
        <div
          className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-emerald-300"
          style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}
        >
          <CheckCircle className="w-4 h-4 flex-none" /> {success}
        </div>
      )}
      {error && (
        <div
          className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-300"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <AlertTriangle className="w-4 h-4 flex-none" /> {error}
        </div>
      )}

      {/* API Endpoint info card */}
      <div
        className="mb-5 rounded-2xl px-4 py-3.5 overflow-hidden"
        style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}
      >
        <div className="flex items-start gap-3 min-w-0">
          <Shield className="w-4 h-4 text-blue-400 flex-none mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-blue-300 mb-1">Native App Endpoint</p>
            <div
              className="flex items-center gap-1 rounded-md px-2 py-1 mb-1 overflow-hidden"
              style={{ background: "rgba(30,58,138,0.25)" }}
            >
              <code
                className="text-[11px] font-mono text-blue-200 flex-1 min-w-0 break-all leading-relaxed"
              >
                POST {endpointUrl}
              </code>
              <CopyButton text={`POST ${endpointUrl}`} />
            </div>
            <p className="text-[11px] text-blue-400/70 break-all">
              Body: <code className="font-mono">{"{ versionCode: int, platform: \"android\" | \"ios\" }"}</code>
            </p>
          </div>
        </div>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="mb-5">
          <VersionForm
            form={form}
            onChange={(f) => setForm((prev) => ({ ...prev, ...f }))}
            onSubmit={handleSubmit}
            submitting={submitting}
            onCancel={() => { setShowForm(false); setEditTarget(null); setForm(EMPTY_FORM); setError(""); }}
            editMode={!!editTarget}
          />
        </div>
      )}

      {/* Version list */}
      {versions.length === 0 ? (
        <div
          className="rounded-2xl px-6 py-12 text-center"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <RefreshCw className="w-8 h-8 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">No versions yet</p>
          <p className="text-gray-600 text-sm mt-1">Create your first version to start managing updates.</p>
          <button
            onClick={openCreate}
            className="mt-4 px-5 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all"
            style={{ background: "linear-gradient(135deg, #e50914 0%, #b0060f 100%)" }}
          >
            <Plus className="w-3.5 h-3.5 inline mr-1.5" />
            New Version
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {versions.map((v) => (
            <VersionRow
              key={v._id}
              v={v}
              onToggleActive={handleToggleActive}
              onToggleForce={handleToggleForce}
              onDelete={handleDelete}
              onEdit={openEdit}
              isPending={isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
