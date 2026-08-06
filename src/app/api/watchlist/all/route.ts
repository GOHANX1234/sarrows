import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Watchlist from "@/models/Watchlist";
import Movie from "@/models/Movie";
import Series from "@/models/Series";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;
    const typeFilter = searchParams.get("type"); // "Movie" | "Series" | null

    const query: Record<string, unknown> = { user: session.user.id };
    if (typeFilter === "Movie" || typeFilter === "Series") {
      query.targetType = typeFilter;
    }

    await connectDB();

    const [rawItems, total] = await Promise.all([
      Watchlist.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Watchlist.countDocuments(query),
    ]);

    // Bulk-fetch content by type to avoid N+1 queries
    const movieIds = rawItems.filter(i => i.targetType === "Movie").map(i => i.targetId);
    const seriesIds = rawItems.filter(i => i.targetType === "Series").map(i => i.targetId);

    const [movies, seriesDocs] = await Promise.all([
      movieIds.length
        ? Movie.find({ _id: { $in: movieIds } })
            .select("title slug posterUrl bannerUrl releaseYear rating ratingCount genres status")
            .populate("genres", "name")
            .lean()
        : [],
      seriesIds.length
        ? Series.find({ _id: { $in: seriesIds } })
            .select("title slug posterUrl bannerUrl releaseYear rating ratingCount genres type publishStatus")
            .populate("genres", "name")
            .lean()
        : [],
    ]);

    const movieMap = Object.fromEntries(
      (movies as Array<{ _id: { toString(): string } }>).map(m => [m._id.toString(), m])
    );
    const seriesMap = Object.fromEntries(
      (seriesDocs as Array<{ _id: { toString(): string } }>).map(s => [s._id.toString(), s])
    );

    const watchlist = rawItems.map(item => ({
      _id: item._id,
      targetType: item.targetType,
      targetId: item.targetId,
      savedAt: item.createdAt,
      content:
        item.targetType === "Movie"
          ? movieMap[(item.targetId as { toString(): string }).toString()] || null
          : seriesMap[(item.targetId as { toString(): string }).toString()] || null,
    }));

    return NextResponse.json({
      watchlist,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
