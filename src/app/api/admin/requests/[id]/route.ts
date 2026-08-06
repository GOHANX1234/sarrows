import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Request from "@/models/Request";
import { auth } from "@/lib/auth";
import { requestStatusSchema } from "@/lib/validators/content";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
    const body = await req.json();
    const parsed = requestStatusSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    await connectDB();
    const request = await Request.findByIdAndUpdate(id, parsed.data, { new: true, runValidators: true })
      .populate("user", "nickname email")
      .lean();
    if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    return NextResponse.json({ request });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
    await connectDB();
    const request = await Request.findByIdAndDelete(id);
    if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
