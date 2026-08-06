/**
 * @deprecated Use /api/admin/anilist/anime/[id]/episodes/[ep] instead.
 * Kept for backward compatibility. AniList does not expose per-episode titles,
 * so this always returns { title: null }.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ep: string }> }
) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id, ep } = await params;
    const episodeNumber = parseInt(ep, 10);
    if (!id || !/^\d+$/.test(id) || !episodeNumber || episodeNumber < 1) {
      return NextResponse.json({ error: "Invalid id/episode" }, { status: 400 });
    }
    // AniList does not provide per-episode titles via its public API.
    return NextResponse.json({ title: null, note: "AniList does not expose per-episode titles — enter manually." });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
