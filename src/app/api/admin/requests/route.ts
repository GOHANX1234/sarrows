import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Request from "@/models/Request";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await connectDB();
    const requests = await Request.find()
      .sort({ createdAt: -1 })
      .populate("user", "nickname email")
      .lean();
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
