import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import BotConfig from "@/models/BotConfig";

function adminOnly() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/** GET /api/admin/bot/config */
export async function GET() {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") return adminOnly();

    await connectDB();
    const cfg = await BotConfig.findById("singleton").lean();
    if (!cfg) {
      return NextResponse.json({
        enabled: false,
        uploadedCount: 0,
        duplicateCount: 0,
        failedCount: 0,
        lastActivity: null,
        lastError: null,
        lastUploadedTitle: null,
        startedAt: null,
        stoppedAt: null,
        sources: ["popular", "trending_day", "trending_week", "top_rated", "now_playing"],
        currentSourceIdx: 0,
        currentPage: 1,
        currentMovieIdx: 0,
      });
    }
    return NextResponse.json(cfg);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** PATCH /api/admin/bot/config — toggle enabled, update sources */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") return adminOnly();

    const body = await req.json();
    await connectDB();

    const update: any = {};

    if (typeof body.enabled === "boolean") {
      update.enabled = body.enabled;
      update[body.enabled ? "startedAt" : "stoppedAt"] = new Date();
      if (body.enabled) {
        // Set auto-stop timer if a duration was provided
        if (typeof body.stopAfterMs === "number" && body.stopAfterMs > 0) {
          update.stopAfterMs = body.stopAfterMs;
          update.scheduledStopAt = new Date(Date.now() + body.stopAfterMs);
        } else {
          update.stopAfterMs = null;
          update.scheduledStopAt = null;
        }
      } else {
        // Clear timer when manually stopped
        update.scheduledStopAt = null;
      }
    }

    // Update which TMDB sources to pull from
    if (Array.isArray(body.sources) && body.sources.length > 0) {
      const valid = [
        "popular", "trending_day", "trending_week", "top_rated", "now_playing", "upcoming",
        "genre_action", "genre_horror", "genre_comedy", "genre_thriller", "genre_scifi",
        "genre_animation", "genre_drama", "genre_romance", "genre_crime", "genre_documentary",
        "genre_adventure", "genre_fantasy", "genre_mystery", "genre_war",
      ];
      update.sources = body.sources.filter((s: string) => valid.includes(s));
    }

    // Reset cursor (so it starts fresh from the new source list)
    if (body.resetCursor) {
      update.currentSourceIdx = 0;
      update.currentPage = 1;
      update.currentMovieIdx = 0;
    }

    const cfg = await BotConfig.findByIdAndUpdate(
      "singleton",
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    if (typeof body.enabled === "boolean") {
      console.log(`[MovieBot] Bot ${body.enabled ? "ENABLED" : "DISABLED"} by admin`);
    }
    return NextResponse.json(cfg);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** DELETE /api/admin/bot/config — reset stats only */
export async function DELETE() {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") return adminOnly();

    await connectDB();
    const cfg = await BotConfig.findByIdAndUpdate(
      "singleton",
      {
        $set: {
          uploadedCount: 0,
          duplicateCount: 0,
          failedCount: 0,
          lastActivity: null,
          lastError: null,
          lastUploadedTitle: null,
        },
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json(cfg);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
