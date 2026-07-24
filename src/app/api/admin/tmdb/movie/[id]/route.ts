import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTMDBMovieDetails } from "@/lib/external-api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const details = await getTMDBMovieDetails(id);
    if (!details) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(details);
    // details already includes { duration, genreNames, cast }
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
