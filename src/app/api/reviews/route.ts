import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import Review from "@/models/Review";
import Movie from "@/models/Movie";
import Series from "@/models/Series";
import { auth } from "@/lib/auth";
import { reviewSchema } from "@/lib/validators/content";
import sanitizeHtml from "sanitize-html";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { targetType, targetId, rating, comment } = parsed.data;
    const cleanComment = comment ? sanitizeHtml(comment, { allowedTags: [], allowedAttributes: {} }) : undefined;

    await connectDB();

    // Upsert review
    const review = await Review.findOneAndUpdate(
      { user: session.user.id, targetType, targetId },
      { rating, comment: cleanComment },
      { new: true, upsert: true }
    ).populate("user", "nickname image");

    // Update rating on the target
    const reviews = await Review.find({ targetType, targetId });
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const Model = targetType === "Movie" ? Movie : Series;
    await (Model as any).findByIdAndUpdate(targetId, {
      rating: Math.round(avg * 10) / 10,
      ratingCount: reviews.length,
    });

    return NextResponse.json({ review });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const targetType = searchParams.get("targetType");
    const targetId = searchParams.get("targetId");
    if (!targetType || !targetId) return NextResponse.json({ error: "Missing params" }, { status: 400 });
    await connectDB();
    const reviews = await Review.find({ targetType, targetId })
      .populate("user", "nickname image")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
