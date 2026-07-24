import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Movie from "@/models/Movie";
import "@/models/Genre";
import Review from "@/models/Review";
import { auth } from "@/lib/auth";
import MovieDetailClient from "@/components/detail/MovieDetailClient";
import ViewTracker from "@/components/ui/ViewTracker";
import { detectKind } from "@/lib/stream-security";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getMovie(slug: string) {
  await connectDB();
  return Movie.findOne({ slug, status: "published" })
    .select("+videoUrl +videoType")
    .populate("genres", "name")
    .lean();
}

async function getReviews(targetId: string) {
  await connectDB();
  return Review.find({ targetType: "Movie", targetId })
    .populate("user", "nickname image")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const movie = await getMovie(slug);
  if (!movie) return { title: "Not Found" };
  return {
    title: (movie as any).title,
    description: (movie as any).description,
    openGraph: { images: (movie as any).posterUrl ? [(movie as any).posterUrl] : [] },
  };
}

export default async function MoviePage({ params }: Props) {
  const { slug } = await params;
  const [movie, session] = await Promise.all([getMovie(slug), auth()]);
  if (!movie) notFound();

  const reviews = await getReviews((movie as any)._id.toString());

  // Never let the real CDN video URL reach the client — the page only learns
  // the playback "kind"; the actual media is fetched through /api/stream/*.
  const { videoUrl, videoType, ...movieRest } = movie as any;
  const streamType = videoUrl ? detectKind(videoUrl, videoType) : null;

  return (
    <>
      <ViewTracker
        targetType="Movie"
        targetId={(movie as any)._id.toString()}
        userId={session?.user?.id}
      />
      <MovieDetailClient
        movie={{ ...JSON.parse(JSON.stringify(movieRest)), hasVideo: Boolean(videoUrl), streamType }}
        reviews={JSON.parse(JSON.stringify(reviews))}
        userId={session?.user?.id}
        userRole={(session?.user as any)?.role}
      />
    </>
  );
}
