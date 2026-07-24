import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import WatchHistory from "@/models/WatchHistory";
import Movie from "@/models/Movie";
import Episode from "@/models/Episode";
import Series from "@/models/Series";
import { auth } from "@/lib/auth";
import { z } from "zod";

const watchHistorySchema = z.object({
  targetType: z.enum(["Movie", "Episode"]),
  targetId: z.string().min(1).max(100),
  progressSeconds: z.number().int().min(0).max(86400), // max 24h
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "30")));
    const skip = (page - 1) * limit;

    await connectDB();

    const [rawHistory, total] = await Promise.all([
      WatchHistory.find({ user: session.user.id })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WatchHistory.countDocuments({ user: session.user.id }),
    ]);

    // Bulk-fetch content by type to avoid N+1 queries
    const movieIds = rawHistory.filter(h => h.targetType === "Movie").map(h => h.targetId);
    const episodeIds = rawHistory.filter(h => h.targetType === "Episode").map(h => h.targetId);

    const [movies, episodes] = await Promise.all([
      movieIds.length
        ? Movie.find({ _id: { $in: movieIds } })
            .select("title slug posterUrl releaseYear rating duration")
            .lean()
        : [],
      episodeIds.length
        ? Episode.find({ _id: { $in: episodeIds } })
            .select("title episodeNumber season series")
            .lean()
        : [],
    ]);

    // Fetch parent series for episodes
    const seriesIds = [
      ...new Set(
        (episodes as Array<{ series?: { toString(): string } }>)
          .map(e => e.series?.toString())
          .filter(Boolean) as string[]
      ),
    ];
    const seriesDocs = seriesIds.length
      ? await Series.find({ _id: { $in: seriesIds } })
          .select("title slug posterUrl")
          .lean()
      : [];

    // Build lookup maps
    const movieMap = Object.fromEntries(
      (movies as Array<{ _id: { toString(): string } }>).map(m => [m._id.toString(), m])
    );
    const episodeMap = Object.fromEntries(
      (episodes as Array<{ _id: { toString(): string } }>).map(e => [e._id.toString(), e])
    );
    const seriesMap = Object.fromEntries(
      (seriesDocs as Array<{ _id: { toString(): string } }>).map(s => [s._id.toString(), s])
    );

    const history = rawHistory.map(h => {
      const tid = (h.targetId as { toString(): string }).toString();
      let content = null;

      if (h.targetType === "Movie") {
        content = movieMap[tid] || null;
      } else {
        const ep = episodeMap[tid] as
          | (Record<string, unknown> & { series?: { toString(): string } })
          | undefined;
        if (ep) {
          content = {
            ...ep,
            seriesInfo: ep.series ? seriesMap[ep.series.toString()] || null : null,
          };
        }
      }

      return {
        _id: h._id,
        targetType: h.targetType,
        progressSeconds: h.progressSeconds,
        completed: h.completed,
        updatedAt: h.updatedAt,
        createdAt: h.createdAt,
        content,
      };
    });

    return NextResponse.json({
      history,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ ok: true }); // silently skip unauthenticated
    const body = await req.json();
    const parsed = watchHistorySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false });

    const { targetType, targetId, progressSeconds } = parsed.data;
    await connectDB();
    await WatchHistory.findOneAndUpdate(
      { user: session.user.id, targetType, targetId },
      { progressSeconds, completed: false },
      { upsert: true, new: true }
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
