export const dynamic = "force-dynamic";

import HeroSection from "@/components/home/HeroSection";
import ContentRow from "@/components/home/ContentRow";
import { Flame, Tv, Film, Sparkles } from "lucide-react";
import { connectDB } from "@/lib/db";
import Movie from "@/models/Movie";
import Series from "@/models/Series";
import "@/models/Genre";
import { serialize } from "@/lib/utils";

async function getTrending() {
  await connectDB();
  const [movies, series] = await Promise.all([
    Movie.find({ status: "published" }).sort({ views: -1 }).limit(10).populate("genres", "name").lean(),
    Series.find({ publishStatus: "published" }).sort({ views: -1 }).limit(10).populate("genres", "name").lean(),
  ]);
  return { movies, series };
}

async function getLatest() {
  await connectDB();
  const [movies, anime] = await Promise.all([
    Movie.find({ status: "published" }).sort({ createdAt: -1 }).limit(10).populate("genres", "name").lean(),
    Series.find({ publishStatus: "published", type: "anime" }).sort({ createdAt: -1 }).limit(10).populate("genres", "name").lean(),
  ]);
  return { movies, anime };
}

export default async function HomePage() {
  const [{ movies: trendingMovies, series: trendingSeries }, { movies: latestMovies, anime: latestAnime }] =
    await Promise.all([getTrending(), getLatest()]);

  const heroItems = serialize([...trendingMovies.slice(0, 3), ...trendingSeries.slice(0, 2)].slice(0, 5));
  const trendingMoviesSafe = serialize(trendingMovies);
  const trendingSeriesSafe = serialize(trendingSeries);
  const latestMoviesSafe = serialize(latestMovies);
  const latestAnimeSafe = serialize(latestAnime);

  return (
    <div className="min-h-screen">
      <HeroSection items={heroItems} />

      <div className="px-4 md:px-8 lg:px-12 py-10 space-y-12 max-w-screen-2xl mx-auto">
        {trendingMoviesSafe.length > 0 && (
          <ContentRow title="Trending Movies" icon={<Flame className="w-5 h-5 text-sarrows-red" />} items={trendingMoviesSafe} type="movie" viewAllHref="/movies?sort=views" />
        )}
        {trendingSeriesSafe.length > 0 && (
          <ContentRow title="Popular Anime" icon={<Tv className="w-5 h-5 text-sarrows-red" />} items={trendingSeriesSafe} type="series" viewAllHref="/anime?sort=views" />
        )}
        {latestMoviesSafe.length > 0 && (
          <ContentRow title="Latest Movies" icon={<Film className="w-5 h-5 text-sarrows-red" />} items={latestMoviesSafe} type="movie" viewAllHref="/movies" />
        )}
        {latestAnimeSafe.length > 0 && (
          <ContentRow title="New Anime" icon={<Sparkles className="w-5 h-5 text-sarrows-red" />} items={latestAnimeSafe} type="series" viewAllHref="/anime" />
        )}
        {heroItems.length === 0 && (
          <div className="text-center py-24">
            <p className="text-gray-600 text-lg">No content yet. Add some from the admin panel.</p>
          </div>
        )}
      </div>
    </div>
  );
}
