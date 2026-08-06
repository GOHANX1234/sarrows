import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Series from "@/models/Series";
import "@/models/Genre";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id))
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const session = await auth();
    const isAdmin = (session?.user as any)?.role === "admin";

    await connectDB();
    const series: any = await Series.findById(id)
      .populate("genres", "name")
      .lean();

    if (!series) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Non-admins can only see published series
    if (!isAdmin && series.publishStatus !== "published")
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ series });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
