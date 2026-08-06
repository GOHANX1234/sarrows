import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import { auth } from "@/lib/auth";
import { scrapeAnimeSaltEpisode } from "@/lib/animesalt";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const season = Number(body.season);
    const episode = Number(body.episode);
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const configuredUrl =
      typeof body.animeSaltUrl === "string" ? body.animeSaltUrl.trim() : "";

    if (!Number.isInteger(season) || season < 1 || !Number.isInteger(episode) || episode < 1) {
      return NextResponse.json({ error: "Invalid season or episode number" }, { status: 400 });
    }

    const sourceUrl =
      configuredUrl ||
      (title
        ? `https://animesalt.link/series/${slugify(title, { lower: true, strict: true })}/`
        : "");

    if (!sourceUrl) {
      return NextResponse.json({ error: "Anime title or AnimeSalt URL is required" }, { status: 400 });
    }

    const result = await scrapeAnimeSaltEpisode(sourceUrl, season, episode);
    return NextResponse.json({
      videoUrl: result.videoUrl,
      videoType: "embed",
      sourceUrl: result.sourceUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AnimeSalt lookup failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}