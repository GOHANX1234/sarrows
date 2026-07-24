import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Series from "@/models/Series";
import Episode from "@/models/Episode";
import Review from "@/models/Review";
import "@/models/Genre";
import { auth } from "@/lib/auth";
import SeriesDetailClient from "@/components/detail/SeriesDetailClient";
import ViewTracker from "@/components/ui/ViewTracker";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getSeries(slug: string) {
  await connectDB();
  return Series.findOne({ slug, publishStatus: "published" })
    .populate("genres", "name")
    .lean();
}

async function getEpisodes(seriesId: string) {
  await connectDB();
  return Episode.find({ series: seriesId })
    .sort({ season: 1, episodeNumber: 1 })
    .lean();
}

async function getReviews(targetId: string) {
  await connectDB();
  return Review.find({ targetType: "Series", targetId })
    .populate("user", "nickname image")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const series = await getSeries(slug);
  if (!series) return { title: "Not Found" };
  return {
    title: (series as any).title,
    description: (series as any).description,
  };
}

export default async function AnimeDetailPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  const series = await getSeries(slug);
  if (!series) notFound();

  const [episodes, reviews] = await Promise.all([
    getEpisodes((series as any)._id.toString()),
    getReviews((series as any)._id.toString()),
  ]);

  return (
    <>
      <ViewTracker
        targetType="Series"
        targetId={(series as any)._id.toString()}
        userId={session?.user?.id}
      />
      <SeriesDetailClient
        series={JSON.parse(JSON.stringify(series))}
        episodes={JSON.parse(JSON.stringify(episodes))}
        reviews={JSON.parse(JSON.stringify(reviews))}
        userId={session?.user?.id}
        userRole={(session?.user as any)?.role}
      />
    </>
  );
}
