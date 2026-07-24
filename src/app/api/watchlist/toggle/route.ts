import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Watchlist from "@/models/Watchlist";
import { auth } from "@/lib/auth";

const VALID_TARGET_TYPES = ["Movie", "Series"];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { targetType, targetId } = await req.json();
    if (!VALID_TARGET_TYPES.includes(targetType) || !mongoose.isValidObjectId(targetId)) {
      return NextResponse.json({ error: "Invalid targetType or targetId" }, { status: 400 });
    }
    await connectDB();
    const existing = await Watchlist.findOne({ user: session.user.id, targetType, targetId });
    if (existing) {
      await existing.deleteOne();
      return NextResponse.json({ inWatchlist: false });
    } else {
      await Watchlist.create({ user: session.user.id, targetType, targetId });
      return NextResponse.json({ inWatchlist: true });
    }
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
