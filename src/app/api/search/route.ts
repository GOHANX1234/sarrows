import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Movie from "@/models/Movie";
import Series from "@/models/Series";
import "@/models/Genre";
import { escapeRegex } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 2) return NextResponse.json({ movies: [], series: [] });
    // Escape user input to prevent ReDoS
    const safeQ = escapeRegex(q.slice(0, 100)); // also cap length
    await connectDB();
    const regex = new RegExp(safeQ, "i");
    const filter = { $or: [{ title: regex }, { description: regex }] };
    const [movies, series] = await Promise.all([
      Movie.find({ ...filter, status: "published" }).populate("genres", "name").limit(20).lean(),
      Series.find({ ...filter, publishStatus: "published" }).populate("genres", "name").limit(20).lean(),
    ]);
    return NextResponse.json({ movies, series });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
