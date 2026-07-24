export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Watchlist from "@/models/Watchlist";
import "@/models/Genre";
import WatchlistGrid from "@/components/watchlist/WatchlistGrid";

export default async function WatchlistPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/watchlist");

  await connectDB();
  const items = await Watchlist.find({ user: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  // Populate movie/series refs manually
  const Movie = (await import("@/models/Movie")).default;
  const Series = (await import("@/models/Series")).default;

  const populated = await Promise.all(
    items.map(async (item) => {
      const Model = item.targetType === "Movie" ? Movie : Series;
      const content = await (Model as any).findById(item.targetId).populate("genres", "name").lean();
      return { ...item, content };
    })
  );

  return (
    <div className="px-4 md:px-8 lg:px-12 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-1">My Watchlist</h1>
        <p className="text-gray-400 text-sm">{items.length} titles saved</p>
      </div>
      <WatchlistGrid items={JSON.parse(JSON.stringify(populated))} />
    </div>
  );
}
