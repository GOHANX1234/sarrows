"use client";

import { useEffect, useRef, useState } from "react";
import { X, AlertTriangle, ExternalLink } from "lucide-react";

const STORAGE_KEY = "sarrows_disclaimer_seen";

/** All focusable elements inside a container */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "textarea",
  "input",
  "select",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export default function DisclaimerDialog() {
  const [open, setOpen] = useState(false);
  const panelRef   = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null); // element that had focus before open

  /* ── Show once per browser ─────────────────────────── */
  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      setOpen(true); // storage blocked (private browsing) — show anyway
    }
  }, []);

  /* ── On open: save focused element, lock scroll, focus panel ── */
  useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement;
    document.body.style.overflow = "hidden";

    // Focus first focusable element inside the panel
    requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    });

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /* ── Keyboard: Escape to close, Tab to trap ────────── */
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { dismiss(); return; }

      if (e.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;
        const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (!focusable.length) { e.preventDefault(); return; }
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    setOpen(false);
    // Restore focus to the element that was active before the dialog opened
    requestAnimationFrame(() => {
      (triggerRef.current as HTMLElement | null)?.focus?.();
    });
  };

  if (!open) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={dismiss}
      aria-hidden="true" /* backdrop is decorative; dialog panel carries the semantics */
    >
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="disclaimer-title"
        aria-describedby="disclaimer-desc"
        className="relative w-full max-w-md rounded-2xl p-6 sm:p-8 text-center"
        style={{
          background: "#0e0e14",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(229,9,20,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button — listed first in DOM so it's the first tab stop */}
        <button
          onClick={dismiss}
          aria-label="Close disclaimer"
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sarrows-red"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-5"
          style={{ background: "rgba(229,9,20,0.12)", border: "1px solid rgba(229,9,20,0.25)" }}
          aria-hidden="true"
        >
          <AlertTriangle className="w-6 h-6 text-sarrows-red" />
        </div>

        {/* Heading */}
        <h2
          id="disclaimer-title"
          className="text-lg sm:text-xl font-black text-white mb-3 leading-tight"
        >
          Third-Party Streaming Notice
        </h2>

        {/* Body */}
        <div id="disclaimer-desc" className="space-y-3 text-sm text-gray-400 leading-relaxed mb-7">
          <p>
            All streaming content on Sarrows is provided by{" "}
            <span className="text-gray-200 font-semibold">third-party services</span>.
            These external players may display ads — we have no control over them.
          </p>
          <p>
            <span className="text-gray-200 font-semibold">Sarrows is a non-profit platform.</span>{" "}
            We do not generate any revenue from ads shown by third-party players and are not
            responsible for any advertisements you may encounter.
          </p>
          <p className="text-gray-500 text-xs">
            We recommend using an ad-blocker for a better experience.
          </p>
        </div>

        {/* Primary CTA */}
        <button
          onClick={dismiss}
          className="w-full bg-sarrows-red hover:bg-red-600 active:bg-red-700 text-white font-bold py-3 rounded-xl transition-all duration-200 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          style={{ boxShadow: "0 4px 20px rgba(229,9,20,0.35)" }}
        >
          I Understand, Continue
        </button>

        {/* Telegram nudge */}
        <a
          href="https://t.me/ClerXin"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-400 text-xs mt-4 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sarrows-red rounded"
        >
          <ExternalLink className="w-3 h-3" aria-hidden="true" />
          Join our Telegram channel for updates
        </a>
      </div>
    </div>
  );
}
