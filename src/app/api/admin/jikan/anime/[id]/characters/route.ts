/**
 * @deprecated Use /api/admin/anilist/anime/[id]/characters instead.
 * This route is kept for backward compatibility — it now proxies to AniList.
 * Note: the {id} parameter must now be an AniList numeric ID, not a MAL ID.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAnilistAnimeCharacters } from "@/lib/external-api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    if (!id || !/^\d+$/.test(id))
      return NextResponse.json({ error: "Invalid AniList id — must be a numeric AniList ID" }, { status: 400 });
    const cast = await getAnilistAnimeCharacters(id);
    return NextResponse.json({ cast });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
