"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", color: "#fff" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Something went wrong</h2>
          <p style={{ color: "#9ca3af", marginBottom: "1.5rem" }}>An unexpected error occurred. Please try again.</p>
          <button
            onClick={reset}
            style={{ background: "#E50914", color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.6rem 1.5rem", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
