import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import Movie from "@/models/Movie";
import "@/models/Genre";
import { auth } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";
import { movieSchema } from "@/lib/validators/content";
import { notifyNewContent } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "24"));
    const skip = (page - 1) * limit;
    const sort = searchParams.get("sort") || "latest";
    const status = searchParams.get("status"); // "published" | "draft" | null (all)
    const q = searchParams.get("q");

    const filter: any = {};
    if (status && ["published", "draft"].includes(status)) filter.status = status;
    if (q && q.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = { $regex: escaped, $options: "i" };
    }

    const sortMap: Record<string, any> = {
      latest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      views: { views: -1 },
      rating: { rating: -1 },
      year: { releaseYear: -1 },
      title: { title: 1 },
    };

    await connectDB();

    const [movies, total] = await Promise.all([
      Movie.find(filter)
        .select("+videoUrl +videoType")
        .sort(sortMap[sort] || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("genres", "name")
        .lean(),
      Movie.countDocuments(filter),
    ]);

    return NextResponse.json({ movies, total, page, totalPages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const parsed = movieSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;
    await connectDB();

    let slug = generateSlug(data.title);
    const existing = await Movie.findOne({ slug });
    if (existing) slug = generateSlug(data.title, Date.now().toString());

    const movie = await Movie.create({ ...data, slug });
    const populated = await Movie.findById(movie._id).select("+videoUrl +videoType").populate("genres", "name").lean();
    revalidatePath("/");
    revalidatePath("/home");
    revalidatePath("/movies");
    await notifyNewContent("movie", {
      id: movie._id.toString(),
      slug: movie.slug,
      title: movie.title,
      description: movie.description,
      posterUrl: movie.posterUrl,
      bannerUrl: movie.bannerUrl,
    });
    return NextResponse.json({ movie: populated }, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ error: "Movie with this title already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
