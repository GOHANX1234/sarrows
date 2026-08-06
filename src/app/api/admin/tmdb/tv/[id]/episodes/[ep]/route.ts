import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTMDBEpisodeTitle } from "@/lib/external-api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ep: string }> }
) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id, ep } = await params;
    const season = parseInt(req.nextUrl.searchParams.get("season") ?? "1", 10);
    const episodeNumber = parseInt(ep, 10);

    if (!id || isNaN(episodeNumber) || episodeNumber < 1 || isNaN(season) || season < 1)
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });

    const title = await getTMDBEpisodeTitle(id, season, episodeNumber);
    return NextResponse.json({ title });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
