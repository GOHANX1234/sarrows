import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Series from "@/models/Series";
import "@/models/Genre";
import { auth } from "@/lib/auth";
import { seriesSchema } from "@/lib/validators/content";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    const body = await req.json();
    const parsed = seriesSchema.partial().safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    await connectDB();
    const series = await Series.findByIdAndUpdate(id, parsed.data, { new: true }).populate("genres", "name").lean();
    if (!series) return NextResponse.json({ error: "Not found" }, { status: 404 });
    revalidatePath("/");
    revalidatePath("/home");
    revalidatePath("/anime");
    revalidatePath("/anime/[slug]", "page");
    return NextResponse.json({ series });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    await connectDB();
    await Series.findByIdAndDelete(id);
    revalidatePath("/");
    revalidatePath("/home");
    revalidatePath("/anime");
    revalidatePath("/anime/[slug]", "page");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
