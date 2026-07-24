import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import Review from "@/models/Review";
import Movie from "@/models/Movie";
import Series from "@/models/Series";
import { auth } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await connectDB();
    const review = await Review.findById(id);
    if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const isOwner = review.user.toString() === session.user.id;
    const isAdmin = (session.user as any).role === "admin";
    if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { targetType, targetId } = review;
    await review.deleteOne();

    // Recompute the denormalized rating/ratingCount on the target — otherwise
    // deleted reviews leave the aggregate stale (same recompute used on create/update).
    const remaining = await Review.find({ targetType, targetId });
    const avg = remaining.length ? remaining.reduce((sum, r) => sum + r.rating, 0) / remaining.length : 0;
    const Model = targetType === "Movie" ? Movie : Series;
    await (Model as any).findByIdAndUpdate(targetId, {
      rating: Math.round(avg * 10) / 10,
      ratingCount: remaining.length,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
