import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import WatchHistory from "@/models/WatchHistory";
import Watchlist from "@/models/Watchlist";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const [user, watchedCount, watchlistCount] = await Promise.all([
      User.findById(session.user.id)
        .select("nickname email image role createdAt")
        .lean(),
      WatchHistory.countDocuments({ user: session.user.id }),
      Watchlist.countDocuments({ user: session.user.id }),
    ]);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const u = user as unknown as {
      _id: unknown;
      nickname: string;
      email: string;
      image?: string;
      role: string;
      createdAt: Date;
    };

    return NextResponse.json({
      user: {
        id: u._id,
        nickname: u.nickname,
        email: u.email,
        image: u.image ?? null,
        role: u.role,
        joinedAt: u.createdAt,
      },
      stats: {
        watchedCount,
        watchlistCount,
      },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
