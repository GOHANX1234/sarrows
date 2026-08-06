import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Episode from "@/models/Episode";
import Series from "@/models/Series";

// Public endpoint — returns episodes for a published series, sorted by
// season then episode number. videoUrl and videoType are never included;
// playback goes through /api/stream/episode/[id].
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const seriesId = searchParams.get("seriesId");

    if (!seriesId) {
      return NextResponse.json({ error: "Missing seriesId" }, { status: 400 });
    }
    if (!mongoose.isValidObjectId(seriesId)) {
      return NextResponse.json({ error: "Invalid seriesId" }, { status: 400 });
    }

    await connectDB();

    // Only expose episodes for published series
    const series = await Series.findById(seriesId)
      .select("publishStatus")
      .lean<{ publishStatus?: string }>();

    if (!series || series.publishStatus !== "published") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const episodes = await Episode.find({ series: seriesId })
      .sort({ season: 1, episodeNumber: 1 })
      .lean();

    return NextResponse.json({ episodes });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
