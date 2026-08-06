import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import Movie from "@/models/Movie";
import "@/models/Genre";
import { auth } from "@/lib/auth";
import { movieSchema } from "@/lib/validators/content";
import mongoose from "mongoose";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    // Never expose the real CDN video URL over the JSON API — playback goes
    // through /api/stream/movie/[id] instead. Admins keep it for editing.
    const session = await auth();
    const isAdmin = (session?.user as any)?.role === "admin";

    await connectDB();
    let query = Movie.findById(id).populate("genres", "name");
    if (isAdmin) query = query.select("+videoUrl +videoType");
    const movie: any = await query.lean();
    if (!movie) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!isAdmin && movie.status !== "published") return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ movie });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    const body = await req.json();
    const parsed = movieSchema.partial().safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    await connectDB();
    const movie = await Movie.findByIdAndUpdate(id, parsed.data, { new: true }).select("+videoUrl +videoType").populate("genres", "name").lean();
    if (!movie) return NextResponse.json({ error: "Not found" }, { status: 404 });
    revalidatePath("/");
    revalidatePath("/home");
    revalidatePath("/movies");
    revalidatePath("/movies/[slug]", "page");
    return NextResponse.json({ movie });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    await connectDB();
    await Movie.findByIdAndDelete(id);
    revalidatePath("/");
    revalidatePath("/home");
    revalidatePath("/movies");
    revalidatePath("/movies/[slug]", "page");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
