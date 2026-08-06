import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Watchlist from "@/models/Watchlist";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ inWatchlist: false });
    const { searchParams } = req.nextUrl;
    const targetType = searchParams.get("targetType");
    const targetId = searchParams.get("targetId");
    await connectDB();
    const item = await Watchlist.findOne({ user: session.user.id, targetType, targetId });
    return NextResponse.json({ inWatchlist: !!item });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
