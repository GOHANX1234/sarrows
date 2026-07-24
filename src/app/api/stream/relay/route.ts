import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { decryptStreamPayload } from "@/lib/stream-security";
import { proxyMedia } from "@/lib/stream-proxy";
import { checkRateLimit } from "@/lib/stream-ratelimit";

// Segment/key/variant relay used by rewritten HLS playlists. The `s` token is an
// opaque, encrypted+signed payload — the real CDN URL never appears in a form a
// client (or anyone inspecting DevTools) can read.
export async function GET(req: NextRequest) {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Segments are fetched frequently during normal playback; allow a generous
  // window while still bounding sustained scraping.
  if (!checkRateLimit(`relay:${uid}`, 600, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const token = req.nextUrl.searchParams.get("s");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const payload = decryptStreamPayload(token);
  if (!payload) return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  if (payload.uid !== uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return proxyMedia(payload.u, req, uid);
}
