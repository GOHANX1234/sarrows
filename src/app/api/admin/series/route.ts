import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import Series from "@/models/Series";
import "@/models/Genre";
import { auth } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";
import { seriesSchema } from "@/lib/validators/content";
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
    const type = searchParams.get("type"); // "anime" | "series" | null (all)
    const publishStatus = searchParams.get("publishStatus"); // "published" | "draft" | null (all)
    const status = searchParams.get("status"); // "ongoing" | "completed" | null (all)
    const q = searchParams.get("q");

    const filter: any = {};
    if (type && ["anime", "series"].includes(type)) filter.type = type;
    if (publishStatus && ["published", "draft"].includes(publishStatus)) filter.publishStatus = publishStatus;
    if (status && ["ongoing", "completed"].includes(status)) filter.status = status;
    if (q && q.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = { $regex: escaped, $options: "i" };
    }

    const sortMap: Record<string, any> = {
      latest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      views: { views: -1 },
      rating: { rating: -1 },
      title: { title: 1 },
    };

    await connectDB();

    const [series, total] = await Promise.all([
      Series.find(filter)
        .sort(sortMap[sort] || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("genres", "name")
        .lean(),
      Series.countDocuments(filter),
    ]);

    return NextResponse.json({ series, total, page, totalPages: Math.ceil(total / limit) });
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
    const parsed = seriesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;
    await connectDB();

    let slug = generateSlug(data.title);
    const existing = await Series.findOne({ slug });
    if (existing) slug = generateSlug(data.title, Date.now().toString());

    const series = await Series.create({ ...data, slug });
    const populated = await Series.findById(series._id).populate("genres", "name").lean();
    revalidatePath("/");
    revalidatePath("/home");
    revalidatePath("/anime");
    revalidatePath("/series");
    await notifyNewContent(data.type, {
      id: series._id.toString(),
      slug: series.slug,
      title: series.title,
      description: series.description,
      posterUrl: series.posterUrl,
      bannerUrl: series.bannerUrl,
    });
    return NextResponse.json({ series: populated }, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ error: "Series with this title already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
