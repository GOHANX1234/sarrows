import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Episode from "@/models/Episode";
import { auth } from "@/lib/auth";
import { episodeSchema } from "@/lib/validators/content";

// Fields an admin may edit on an existing episode. `series` is deliberately
// excluded — this endpoint manages episodes within their current series only;
// moving an episode to a different series is not a supported operation here.
const editableEpisodeSchema = episodeSchema.omit({ series: true }).partial();

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid episode id" }, { status: 400 });
    const body = await req.json();
    const parsed = editableEpisodeSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    await connectDB();
    const episode = await Episode.findByIdAndUpdate(id, parsed.data, { new: true, runValidators: true }).select("+videoUrl +videoType").lean();
    if (!episode) return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    revalidatePath("/home");
    revalidatePath("/anime");
    return NextResponse.json({ episode });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ error: "Episode number already exists for this season" }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid episode id" }, { status: 400 });
    await connectDB();
    const episode = await Episode.findByIdAndDelete(id);
    if (!episode) return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    revalidatePath("/home");
    revalidatePath("/anime");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
