import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getJikanEpisodeTitle } from "@/lib/external-api";

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
    const title = await getJikanEpisodeTitle(id, episodeNumber);
    return NextResponse.json({ title });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
