export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/db";
import Movie from "@/models/Movie";
import Series from "@/models/Series";
import "@/models/Genre";
import { serialize } from "@/lib/utils";
import HomeClient from "@/components/home/HomeClient";

async function getHomeData() {
  await connectDB();

  const [
    moviesByViews,
    seriesByViews,
    moviesByDate,
    animeByDate,
    seriesByDate,
    topRatedMovies,
  ] = await Promise.all([
    Movie.find({ status: "published" }).sort({ views: -1 }).limit(10).populate("genres", "name").lean(),
    Series.find({ publishStatus: "published" }).sort({ views: -1 }).limit(10).populate("genres", "name").lean(),
    Movie.find({ status: "published" }).sort({ createdAt: -1 }).limit(10).populate("genres", "name").lean(),
    Series.find({ publishStatus: "published", type: "anime" }).sort({ createdAt: -1 }).limit(10).populate("genres", "name").lean(),
    Series.find({ publishStatus: "published", type: "series" }).sort({ createdAt: -1 }).limit(10).populate("genres", "name").lean(),
    Movie.find({ status: "published", rating: { $gt: 0 } }).sort({ rating: -1 }).limit(10).populate("genres", "name").lean(),
  ]);

  // Combine top movies and series to compute Top 10 Trending
  const combinedTrending = [...moviesByViews, ...seriesByViews]
    .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
    .slice(0, 10);

  // Filter series by type
  const trendingAnime = seriesByViews.filter((s: any) => s.type === "anime");
  const trendingWebSeries = seriesByViews.filter((s: any) => s.type === "series");

  // Hero items: top 5 featured with images
  const heroItems = [...moviesByViews.slice(0, 3), ...seriesByViews.slice(0, 2)]
    .filter((i: any) => i.bannerUrl || i.posterUrl)
    .slice(0, 5);

  // Mid-page Spotlight: pick a top anime or series or movie
  const featuredSpotlight =
    seriesByViews.find((s: any) => s.bannerUrl && s.rating >= 7) ||
    moviesByViews.find((m: any) => m.bannerUrl && m.rating >= 7) ||
    heroItems[1] ||
    heroItems[0] ||
    null;

  return {
    heroItems: serialize(heroItems),
    top10Items: serialize(combinedTrending),
    trendingMovies: serialize(moviesByViews),
    trendingAnime: serialize(trendingAnime),
    trendingWebSeries: serialize(trendingWebSeries),
    topRated: serialize(topRatedMovies),
    latestMovies: serialize(moviesByDate),
    latestAnime: serialize(animeByDate),
    latestWebSeries: serialize(seriesByDate),
    featuredSpotlight: serialize(featuredSpotlight),
  };
}

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <HomeClient
      heroItems={data.heroItems}
      top10Items={data.top10Items}
      trendingMovies={data.trendingMovies}
      trendingAnime={data.trendingAnime}
      trendingWebSeries={data.trendingWebSeries}
      topRated={data.topRated}
      latestMovies={data.latestMovies}
      latestAnime={data.latestAnime}
      latestWebSeries={data.latestWebSeries}
      featuredSpotlight={data.featuredSpotlight}
    />
  );
}
