import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import Episode from "@/models/Episode";
import { auth } from "@/lib/auth";
import { z } from "zod";

const bulkEpisodeItemSchema = z.object({
  series: z.string().min(1),
  season: z.number().int().positive(),
  episodeNumber: z.number().int().positive(),
  title: z.string().max(200).optional(),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  videoType: z.enum(["auto", "hls", "direct", "embed"]).optional(),
});

const bulkBodySchema = z.object({
  episodes: z.array(bulkEpisodeItemSchema).min(1).max(500),
  skipDuplicates: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = bulkBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    await connectDB();

    const { episodes, skipDuplicates } = parsed.data;

    const results: {
      episodeNumber: number;
      season: number;
      status: "created" | "skipped" | "error";
      episode?: any;
      error?: string;
    }[] = [];

    // Process in batches of 50 for safety
    for (const ep of episodes) {
      try {
        const created = await Episode.create(ep);
        results.push({
          episodeNumber: ep.episodeNumber,
          season: ep.season,
          status: "created",
          episode: created,
        });
      } catch (err: any) {
        if (err.code === 11000) {
          if (skipDuplicates) {
            results.push({
              episodeNumber: ep.episodeNumber,
              season: ep.season,
              status: "skipped",
              error: "Already exists",
            });
          } else {
            results.push({
              episodeNumber: ep.episodeNumber,
              season: ep.season,
              status: "error",
              error: "Episode already exists for this season",
            });
          }
        } else {
          results.push({
            episodeNumber: ep.episodeNumber,
            season: ep.season,
            status: "error",
            error: err.message || "Unknown error",
          });
        }
      }
    }

    revalidatePath("/home");
    revalidatePath("/anime");

    const created = results.filter((r) => r.status === "created");
    const skipped = results.filter((r) => r.status === "skipped");
    const errors  = results.filter((r) => r.status === "error");

    return NextResponse.json({
      results,
      summary: {
        total: episodes.length,
        created: created.length,
        skipped: skipped.length,
        errors: errors.length,
      },
      episodes: created.map((r) => r.episode),
    }, { status: 201 });

  } catch (err: any) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
