import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Movie from "@/models/Movie";
import { auth } from "@/lib/auth";
import { detectKind } from "@/lib/stream-security";
import { checkRateLimit } from "@/lib/stream-ratelimit";

// Third-party embed URLs (cross-origin iframes) can't be proxied like direct/HLS
// media — the iframe needs the real URL as its src. To at least avoid baking it
// into the page HTML/RSC payload, it's only handed out on-demand, post-auth, here.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit(`stream-embed:${uid}`, 30, 60_000)) {
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

  if (detectKind(movie.videoUrl, movie.videoType as any) !== "embed") {
    return NextResponse.json({ error: "This content isn't an embed" }, { status: 400 });
  }

  return NextResponse.json({ url: movie.videoUrl });
}
