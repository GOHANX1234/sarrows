export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import WatchHistory from "@/models/WatchHistory";
import Series from "@/models/Series";
import "@/models/Movie";
import "@/models/Episode";
import { auth } from "@/lib/auth";
import ProfileClient from "@/components/profile/ProfileClient";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const session = await auth();
  await connectDB();

  const user = await User.findOne({ nickname: username }).lean();
  if (!user) notFound();

  const isOwner = session?.user?.id === (user as any)._id.toString();

  let history: any[] = [];
  if (isOwner) {
    // Step 1: populate targetId (Movie or Episode fields only — no cross-schema nested ref)
    const raw = await WatchHistory.find({ user: (user as any)._id })
      .populate("targetId", "title slug posterUrl episodeNumber series")
      .sort({ updatedAt: -1 })
      .limit(30)
      .lean();

    // Step 2: for Episode entries, fetch their parent Series separately
    const episodeEntries = raw.filter((h) => h.targetType === "Episode" && (h.targetId as any)?.series);
    const seriesIds = [...new Set(episodeEntries.map((h) => String((h.targetId as any).series)))];

    const seriesDocs = seriesIds.length
      ? await Series.find({ _id: { $in: seriesIds } }).select("slug title posterUrl").lean()
      : [];

    const seriesMap = Object.fromEntries(seriesDocs.map((s: any) => [String(s._id), s]));

    // Step 3: attach series info to each Episode entry
    history = raw.map((h) => {
      if (h.targetType === "Episode") {
        const ep = h.targetId as any;
        const seriesId = ep?.series ? String(ep.series) : null;
        return {
          ...h,
          targetId: {
            ...ep,
            seriesDoc: seriesId ? seriesMap[seriesId] ?? null : null,
          },
        };
      }
      return h;
    });
  }

  return (
    <ProfileClient
      user={JSON.parse(JSON.stringify(user))}
      history={JSON.parse(JSON.stringify(history))}
      isOwner={isOwner}
    />
  );
}
