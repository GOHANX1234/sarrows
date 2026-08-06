import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Movie from "@/models/Movie";
import Genre from "@/models/Genre";
import { escapeRegex } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const genre = searchParams.get("genre");
    const year = searchParams.get("year");
    const sort = searchParams.get("sort") || "latest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "24"));
    const skip = (page - 1) * limit;

    const filter: any = { status: "published" };
    if (genre) {
      const safeGenre = escapeRegex(genre.slice(0, 50));
      const g = await Genre.findOne({ name: { $regex: new RegExp(`^${safeGenre}$`, "i") } });
      if (g) filter.genres = g._id;
    }
    if (year) {
      const y = parseInt(year);
      if (isFinite(y)) filter.releaseYear = y;
    }

    const sortMap: Record<string, any> = {
      latest: { createdAt: -1 },
      views: { views: -1 },
      rating: { rating: -1 },
      year: { releaseYear: -1 },
    };

    const [movies, total] = await Promise.all([
      Movie.find(filter).sort(sortMap[sort] || { createdAt: -1 }).skip(skip).limit(limit).populate("genres", "name").lean(),
      Movie.countDocuments(filter),
    ]);

    return NextResponse.json({ movies, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
