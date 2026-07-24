import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import Genre from "@/models/Genre";
import { auth } from "@/lib/auth";
import { escapeRegex } from "@/lib/utils";

export async function GET() {
  try {
    await connectDB();
    const genres = await Genre.find().sort({ name: 1 }).lean();
    return NextResponse.json({ genres });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let trimmed = "";
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { name } = await req.json();
    trimmed = name?.trim() ?? "";
    if (!trimmed) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    await connectDB();
    const safePattern = new RegExp(`^${escapeRegex(trimmed)}$`, "i");
    // Fast-path pre-check for a friendlier response; the real uniqueness guarantee
    // is the collated unique index on Genre.name (strength: 2 = case-insensitive).
    const existing = await Genre.findOne({ name: { $regex: safePattern } }).lean();
    if (existing) return NextResponse.json({ genre: existing }, { status: 200 });

    const genre = await Genre.create({ name: trimmed });
    revalidatePath("/movies");
    revalidatePath("/anime");
    return NextResponse.json({ genre }, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) {
      // Lost the race: another concurrent request created the (case-variant) genre first.
      // Return it instead of erroring so callers like the autofill flow can still resolve a valid id.
      if (trimmed) {
        const safePattern = new RegExp(`^${escapeRegex(trimmed)}$`, "i");
        const existing = await Genre.findOne({ name: { $regex: safePattern } }).lean();
        if (existing) return NextResponse.json({ genre: existing }, { status: 200 });
      }
      return NextResponse.json({ error: "Genre already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
