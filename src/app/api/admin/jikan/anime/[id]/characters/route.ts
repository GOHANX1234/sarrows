import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getJikanAnimeCharacters } from "@/lib/external-api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const cast = await getJikanAnimeCharacters(id);
    return NextResponse.json({ cast });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
