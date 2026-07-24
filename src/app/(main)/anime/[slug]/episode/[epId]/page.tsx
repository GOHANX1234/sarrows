export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Episode from "@/models/Episode";
import Series from "@/models/Series";
import { auth } from "@/lib/auth";
import EpisodePlayer from "@/components/player/EpisodePlayer";
import ViewTracker from "@/components/ui/ViewTracker";
import { detectKind } from "@/lib/stream-security";

interface Props {
  params: Promise<{ slug: string; epId: string }>;
}

export default async function EpisodePage({ params }: Props) {
  const { slug, epId } = await params;
  const session = await auth();
  await connectDB();

  const [series, episode] = await Promise.all([
    Series.findOne({ slug, publishStatus: "published" }).lean(),
    Episode.findById(epId).select("+videoUrl +videoType").lean(),
  ]);

  if (!series || !episode) notFound();

  // Verify the episode actually belongs to this series — prevent cross-series URL spoofing
  if ((episode as any).series?.toString() !== (series as any)._id.toString()) notFound();

  const allEpisodes = await Episode.find({ series: (series as any)._id })
    .sort({ season: 1, episodeNumber: 1 })
    .lean();

  const currentIndex = allEpisodes.findIndex((e) => (e._id as any).toString() === epId);
  const prevEp = currentIndex > 0 ? allEpisodes[currentIndex - 1] : null;
  const nextEp = currentIndex < allEpisodes.length - 1 ? allEpisodes[currentIndex + 1] : null;

  // Never let the real CDN video URL reach the client.
  const { videoUrl, videoType, ...episodeRest } = episode as any;
  const streamType = videoUrl ? detectKind(videoUrl, videoType) : null;
  const stripUrl = (ep: any) => {
    if (!ep) return null;
    const { videoUrl: _omit, ...rest } = ep;
    return rest;
  };

  return (
    <>
      <ViewTracker
        targetType="Episode"
        targetId={(episode as any)._id.toString()}
        userId={session?.user?.id}
      />
      <EpisodePlayer
        episode={{ ...JSON.parse(JSON.stringify(episodeRest)), hasVideo: Boolean(videoUrl), streamType }}
        series={JSON.parse(JSON.stringify(series))}
        prevEpisode={prevEp ? JSON.parse(JSON.stringify(stripUrl(prevEp))) : null}
        nextEpisode={nextEp ? JSON.parse(JSON.stringify(stripUrl(nextEp))) : null}
      />
    </>
  );
}
