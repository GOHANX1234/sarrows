import dns from "dns";
import { Agent } from "undici";
import ipaddr from "ipaddr.js";
import { detectKind, encryptStreamPayload } from "@/lib/stream-security";

const RELAY_PATH = "/api/stream/relay";

// SSRF guard: only ever proxy plain http(s) requests to a public host. Blocks
// loopback, private (RFC1918), link-local, and other reserved/non-routable
// ranges so a malicious/compromised `videoUrl` (or a rewritten playlist
// reference) can't be used to reach internal services. Uses ipaddr.js rather
// than hand-rolled regexes because it correctly normalizes IPv4-mapped IPv6
// literals (e.g. `::ffff:127.0.0.1`) before range-checking — a common SSRF
// bypass for naive string-based checks.
const ALLOWED_RANGES = new Set(["unicast"]);

function isBlockedIp(rawIp: string): boolean {
  let addr: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    addr = ipaddr.process(rawIp); // normalizes IPv4-mapped IPv6 -> IPv4
  } catch {
    return true; // unparsable — treat as unsafe
  }
  const range = addr.range(); // e.g. "unicast", "private", "loopback", "linkLocal", "uniqueLocal", "reserved", "carrierGradeNat", ...
  return !ALLOWED_RANGES.has(range);
}

/**
 * Validate a URL is safe to fetch server-side: http(s) only, and — crucially —
 * resolves (via DNS, not just literal-string checks) to a public IP. This
 * closes the classic SSRF bypass where an attacker-controlled hostname
 * resolves to 127.0.0.1 / 169.254.169.254 / a private range, including via
 * IPv4-mapped IPv6 representations.
 */
export async function assertSafeUpstreamUrl(url: string): Promise<void> {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Unsupported protocol");
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");

  // Literal IP in the URL — check directly, no DNS lookup needed/possible.
  if (ipaddr.isValid(hostname)) {
    if (isBlockedIp(hostname)) throw new Error("Blocked host");
    return;
  }

  if (hostname.toLowerCase() === "localhost" || hostname.toLowerCase().endsWith(".localhost")) {
    throw new Error("Blocked host");
  }

  let addresses: string[];
  try {
    const results = await dns.promises.lookup(hostname, { all: true, verbatim: true });
    addresses = results.map((r) => r.address);
  } catch {
    throw new Error("DNS resolution failed");
  }
  if (addresses.length === 0 || addresses.some((addr) => isBlockedIp(addr))) {
    throw new Error("Blocked host (resolves to a disallowed address)");
  }
}

/**
 * A `dns.lookup`-compatible function that re-validates every address at the
 * moment the socket is actually opened, not just ahead of time. This closes
 * the DNS-rebinding TOCTOU gap: `assertSafeUpstreamUrl` can only check the
 * answer it was given, but an attacker-controlled DNS server could return a
 * public IP for that check and a private one moments later for the real
 * connection. Passing this as the `lookup` for our fetch `Agent` means the
 * validation and the actual connection target are the same lookup call.
 */
function validatingLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void
): void {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, [] as any);
    const list = addresses as dns.LookupAddress[];
    const safe = list.filter((a) => !isBlockedIp(a.address));
    if (safe.length === 0) {
      return callback(new Error(`Blocked host: ${hostname} has no allowed addresses`), [] as any);
    }
    if (options.all) {
      callback(null, safe as any);
    } else {
      callback(null, safe[0].address, safe[0].family);
    }
  });
}

// Shared dispatcher for all upstream media fetches: forces DNS resolution
// through `validatingLookup` so the SSRF check and the connection target can
// never diverge.
const safeDispatcher = new Agent({ connect: { lookup: validatingLookup as any } });

/** Resolve a possibly-relative playlist URI against the playlist's own URL. */
function resolveUri(uri: string, baseUrl: string): string {
  try {
    return new URL(uri, baseUrl).toString();
  } catch {
    return uri;
  }
}

async function toRelayUrl(targetUrl: string, uid: string): Promise<string> {
  // Validate before minting a token — an attacker who can influence playlist
  // content shouldn't be able to get us to later fetch an internal address.
  await assertSafeUpstreamUrl(targetUrl);
  const token = encryptStreamPayload({ u: targetUrl, uid, exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60 });
  return `${RELAY_PATH}?s=${token}`;
}

/**
 * Rewrite every URI in an HLS playlist (master or media) so it points back
 * through our same-origin relay instead of the real CDN. Handles nested
 * variant playlists, encryption keys (#EXT-X-KEY), and init segments (#EXT-X-MAP).
 */
export async function rewritePlaylist(text: string, playlistUrl: string, uid: string): Promise<string> {
  const attrUriRegex = /URI="([^"]+)"/;

  const lines = await Promise.all(
    text.split("\n").map(async (line) => {
      const trimmed = line.trim();
      if (trimmed === "") return line;

      if (trimmed.startsWith("#EXT-X-KEY") || trimmed.startsWith("#EXT-X-MAP")) {
        const match = trimmed.match(attrUriRegex);
        if (!match) return line;
        const absolute = resolveUri(match[1], playlistUrl);
        const relay = await toRelayUrl(absolute, uid);
        return line.replace(attrUriRegex, `URI="${relay}"`);
      }

      if (trimmed.startsWith("#")) return line;

      // Plain URI line — a media segment or a nested variant playlist.
      const absolute = resolveUri(trimmed, playlistUrl);
      return toRelayUrl(absolute, uid);
    })
  );
  return lines.join("\n");
}

function isPlaylistContent(contentType: string | null, url: string): boolean {
  if (contentType && (contentType.includes("mpegurl") || contentType.includes("m3u8"))) return true;
  return detectKind(url) === "hls";
}

/**
 * Fetch a resource from the real origin and stream it back to the client
 * without ever exposing the origin URL. HLS playlists are recursively
 * rewritten so every nested reference also stays same-origin.
 */
/** Fetch with manual redirect handling so every hop is SSRF-checked, not just the first. */
async function safeFetch(url: string, headers: HeadersInit, maxHops = 5): Promise<Response> {
  let currentUrl = url;
  for (let hop = 0; hop <= maxHops; hop++) {
    await assertSafeUpstreamUrl(currentUrl);
    const res = await fetch(currentUrl, { headers, redirect: "manual", dispatcher: safeDispatcher } as RequestInit);
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return res;
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    return res;
  }
  throw new Error("Too many redirects");
}

export async function proxyMedia(originUrl: string, req: Request, uid: string): Promise<Response> {
  try {
    await assertSafeUpstreamUrl(originUrl);
  } catch {
    return new Response(JSON.stringify({ error: "Refused to fetch this source" }), { status: 502 });
  }

  const upstreamHeaders: HeadersInit = {
    "User-Agent": "Mozilla/5.0 (compatible; SarrowsPlayer/1.0)",
  };
  const range = req.headers.get("range");
  if (range) (upstreamHeaders as Record<string, string>)["Range"] = range;

  let upstream: Response;
  try {
    upstream = await safeFetch(originUrl, upstreamHeaders);
  } catch {
    return new Response(JSON.stringify({ error: "Upstream unavailable" }), { status: 502 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new Response(JSON.stringify({ error: "Upstream error" }), { status: upstream.status || 502 });
  }

  const contentType = upstream.headers.get("content-type");

  if (isPlaylistContent(contentType, originUrl)) {
    const text = await upstream.text();
    const rewritten = await rewritePlaylist(text, originUrl, uid);
    return new Response(rewritten, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "private, no-store",
      },
    });
  }

  const headers = new Headers();
  headers.set("Content-Type", contentType || "application/octet-stream");
  headers.set("Cache-Control", "private, no-store");
  headers.set("Accept-Ranges", "bytes");
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);
  const contentRange = upstream.headers.get("content-range");
  if (contentRange) headers.set("Content-Range", contentRange);

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
