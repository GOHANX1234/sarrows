import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Movie from "@/models/Movie";
import { auth } from "@/lib/auth";
import { detectKind } from "@/lib/stream-security";
import { proxyMedia } from "@/lib/stream-proxy";
import { checkRateLimit } from "@/lib/stream-ratelimit";

// Same-origin playback endpoint. The browser/hls.js requests this URL directly
// (cookies are sent automatically) — the real CDN URL is never sent to the client.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit(`stream-init:${uid}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await connectDB();
  const movie = await Movie.findById(id)
    .select("+videoUrl +videoType status")
    .lean<{ videoUrl?: string; videoType?: string; status?: string }>();
  if (!movie || movie.status !== "published" || !movie.videoUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const kind = detectKind(movie.videoUrl, movie.videoType as any);
  if (kind === "embed") {
    return NextResponse.json({ error: "Use /api/stream/movie/[id]/embed for this content" }, { status: 400 });
  }

  return proxyMedia(movie.videoUrl, req, uid);
}
