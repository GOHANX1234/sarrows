export const dynamic = "force-dynamic";

import MovieGrid from "@/components/browse/MovieGrid";
import BrowseFilters from "@/components/browse/BrowseFilters";
import { connectDB } from "@/lib/db";
import Movie from "@/models/Movie";
import Genre from "@/models/Genre";
import { serialize } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ genre?: string; year?: string; sort?: string; page?: string }>;
}

async function getMovies(params: { genre?: string; year?: string; sort?: string; page?: string }) {
  await connectDB();
  const filter: any = { status: "published" };
  if (params.genre) {
    const genre = await Genre.findOne({ name: { $regex: new RegExp(`^${params.genre}$`, "i") } });
    if (genre) filter.genres = genre._id;
  }
  if (params.year) filter.releaseYear = parseInt(params.year);

  const sortMap: Record<string, any> = {
    latest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    rating: { rating: -1 },
    views: { views: -1 },
    year: { releaseYear: -1 },
  };
  const sort = sortMap[params.sort || "latest"] || { createdAt: -1 };
  const page = Math.max(1, parseInt(params.page || "1"));
  const limit = 24;
  const skip = (page - 1) * limit;

  const [movies, total] = await Promise.all([
    Movie.find(filter).sort(sort).skip(skip).limit(limit).populate("genres", "name").lean(),
    Movie.countDocuments(filter),
  ]);

  return { movies, total, page, totalPages: Math.ceil(total / limit) };
}

async function getGenres() {
  await connectDB();
  return Genre.find().sort({ name: 1 }).lean();
}

export default async function MoviesPage({ searchParams }: Props) {
  const params = await searchParams;
  const [{ movies, total, page, totalPages }, genres] = await Promise.all([
    getMovies(params),
    getGenres(),
  ]);

  return (
    <div className="px-4 md:px-8 lg:px-12 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-1">Movies</h1>
        <p className="text-gray-400 text-sm">{total} titles available</p>
      </div>
      <BrowseFilters genres={serialize(genres)} currentParams={params} basePath="/movies" />
      <MovieGrid items={serialize(movies)} type="movie" page={page} totalPages={totalPages} basePath="/movies" currentParams={params} />
    </div>
  );
}
