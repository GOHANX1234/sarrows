import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchAnilistAnime } from "@/lib/external-api";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q") || "";
    if (!q.trim()) return NextResponse.json({ results: [] });

    const results = await searchAnilistAnime(q);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
