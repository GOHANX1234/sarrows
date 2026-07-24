import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Episode from "@/models/Episode";
import { auth } from "@/lib/auth";
import { episodeSchema } from "@/lib/validators/content";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const parsed = episodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    await connectDB();
    const episode = await Episode.create(parsed.data);
    revalidatePath("/home");
    revalidatePath("/anime");
    return NextResponse.json({ episode }, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ error: "Episode number already exists for this season" }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = req.nextUrl;
    const seriesId = searchParams.get("seriesId");
    if (!seriesId) return NextResponse.json({ error: "Missing seriesId" }, { status: 400 });
    if (!mongoose.isValidObjectId(seriesId)) return NextResponse.json({ error: "Invalid seriesId" }, { status: 400 });
    await connectDB();
    const episodes = await Episode.find({ series: seriesId }).select("+videoUrl +videoType").sort({ season: 1, episodeNumber: 1 }).lean();
    return NextResponse.json({ episodes });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
