import crypto from "crypto";

/**
 * Streaming link security.
 *
 * Goals:
 * - Never send the real origin CDN URL (movie/episode `videoUrl`) to the browser —
 *   not in page HTML/RSC payload, not in API JSON, not in DevTools Network tab.
 * - All direct/HLS playback goes through same-origin `/api/stream/*` routes that
 *   proxy the bytes server-side. HLS manifests are rewritten so every segment/key/
 *   variant URI also stays same-origin.
 * - Any origin URL that must travel through a client-visible query string (relay
 *   requests for HLS segments) is authenticated-encrypted (AES-256-GCM) — an
 *   observer sees only an opaque token, never the destination host/path.
 * - Tokens are bound to the viewer's user id and expire, so a captured token can't
 *   be replayed by a different session indefinitely.
 */

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required to secure stream links");
  return crypto.createHash("sha256").update(`sarrows-stream:${secret}`).digest();
}

export interface StreamPayload {
  u: string; // target URL (origin CDN)
  uid: string; // viewer user id — token is only valid for this viewer
  exp: number; // unix seconds expiry
}

/** Encrypt a target URL + viewer binding into an opaque, tamper-proof token. */
export function encryptStreamPayload(payload: StreamPayload): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64url");
}

/** Decrypt + verify a token. Returns null if malformed, tampered, or expired. */
export function decryptStreamPayload(token: string): StreamPayload | null {
  try {
    const raw = Buffer.from(token, "base64url");
    if (raw.length < 12 + 16 + 1) return null;
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);
    const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const payload = JSON.parse(plaintext.toString("utf8")) as StreamPayload;
    if (typeof payload.u !== "string" || typeof payload.uid !== "string" || typeof payload.exp !== "number") {
      return null;
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function makeRelayToken(originUrl: string, uid: string, ttlSeconds = 12 * 60 * 60): string {
  return encryptStreamPayload({ u: originUrl, uid, exp: Math.floor(Date.now() / 1000) + ttlSeconds });
}

export type MediaKind = "hls" | "direct" | "embed";
export type MediaKindOverride = "auto" | MediaKind;

/**
 * Classify a (server-only) origin URL so the client only ever learns the kind,
 * never the URL. Many CDN links have no file extension to sniff, so admins can
 * set an explicit `override` (stored per movie/episode) instead of relying on
 * the extension heuristic — this avoids legitimate direct/HLS sources silently
 * falling back to unproxied `embed` URL disclosure.
 */
export function detectKind(url: string | null | undefined, override?: MediaKindOverride | null): MediaKind {
  if (override && override !== "auto") return override;
  if (!url) return "embed";
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    if (path.includes(".m3u8") || path.includes("/m3u8")) return "hls";
    if (path.endsWith(".mp4") || path.endsWith(".webm") || path.endsWith(".ogg") || path.endsWith(".mov")) return "direct";
    return "embed";
  } catch {
    return "embed";
  }
}
