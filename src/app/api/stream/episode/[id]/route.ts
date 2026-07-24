import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Episode from "@/models/Episode";
import Series from "@/models/Series";
import { auth } from "@/lib/auth";
import { detectKind } from "@/lib/stream-security";
import { proxyMedia } from "@/lib/stream-proxy";
import { checkRateLimit } from "@/lib/stream-ratelimit";

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
  const episode = await Episode.findById(id)
    .select("+videoUrl +videoType series")
    .lean<{ videoUrl?: string; videoType?: string; series?: string }>();
  if (!episode || !episode.videoUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = (session?.user as any)?.role === "admin";
  if (!isAdmin) {
    const series = await Series.findById(episode.series).select("publishStatus").lean<{ publishStatus?: string }>();
    if (!series || series.publishStatus !== "published") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const kind = detectKind(episode.videoUrl, episode.videoType as any);
  if (kind === "embed") {
    return NextResponse.json({ error: "Use /api/stream/episode/[id]/embed for this content" }, { status: 400 });
  }

  return proxyMedia(episode.videoUrl, req, uid);
}
