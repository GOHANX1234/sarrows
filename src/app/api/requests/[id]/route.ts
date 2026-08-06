import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Request from "@/models/Request";
import { auth } from "@/lib/auth";

// A user may delete their own pending request (change their mind / dedupe).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid request id" }, { status: 400 });

    await connectDB();
    const existing = await Request.findById(id).lean();
    if (!existing) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (String((existing as any).user) !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if ((existing as any).status !== "pending") {
      return NextResponse.json({ error: "Only pending requests can be cancelled" }, { status: 409 });
    }
    await Request.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
