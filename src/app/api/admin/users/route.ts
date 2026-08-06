import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const skip = (page - 1) * limit;
    const role = searchParams.get("role"); // "user" | "admin" | null (all)
    const q = searchParams.get("q"); // search by nickname or email

    const filter: any = {};
    if (role && ["user", "admin"].includes(role)) filter.role = role;
    if (q && q.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { nickname: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
      ];
    }

    await connectDB();

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("nickname email image role createdAt lockedUntil loginAttempts")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
