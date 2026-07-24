import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import Episode from "@/models/Episode";
import Series from "@/models/Series";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Never expose the real CDN video URL over the JSON API — playback goes
    // through /api/stream/episode/[id] instead. Admins keep it for editing.
    const session = await auth();
    const isAdmin = (session?.user as any)?.role === "admin";

    await connectDB();
    let query = Episode.findById(id);
    if (isAdmin) query = query.select("+videoUrl +videoType");
    const episode: any = await query.lean();
    if (!episode) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Non-admins can only see episodes belonging to a published series —
    // otherwise draft-title metadata (titles, episode numbering) leaks publicly.
    if (!isAdmin) {
      const series = await Series.findById(episode.series).select("publishStatus").lean<{ publishStatus?: string }>();
      if (!series || series.publishStatus !== "published") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ episode });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const body = await req.json();
    // Whitelist updatable fields — prevent mass-assignment of internal fields (_id, series, __v)
    const allowed = ["title", "episodeNumber", "season", "description", "videoUrl", "videoType", "thumbnailUrl", "duration", "airDate"];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }
    await connectDB();
    const episode = await Episode.findByIdAndUpdate(id, { $set: update }, { new: true }).select("+videoUrl +videoType").lean();
    return NextResponse.json({ episode });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    await connectDB();
    await Episode.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
