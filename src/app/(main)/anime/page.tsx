export const dynamic = "force-dynamic";

import MovieGrid from "@/components/browse/MovieGrid";
import BrowseFilters from "@/components/browse/BrowseFilters";
import { connectDB } from "@/lib/db";
import Series from "@/models/Series";
import Genre from "@/models/Genre";
import { serialize } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ genre?: string; year?: string; sort?: string; page?: string; status?: string }>;
}

async function getAnime(params: { genre?: string; year?: string; sort?: string; page?: string; status?: string }) {
  await connectDB();
  const filter: any = { publishStatus: "published", type: "anime" };
  if (params.genre) {
    const genre = await Genre.findOne({ name: { $regex: new RegExp(`^${params.genre}$`, "i") } });
    if (genre) filter.genres = genre._id;
  }
  if (params.status) filter.status = params.status;

  const sortMap: Record<string, any> = {
    latest: { createdAt: -1 },
    rating: { rating: -1 },
    views: { views: -1 },
  };
  const sort = sortMap[params.sort || "latest"] || { createdAt: -1 };
  const page = Math.max(1, parseInt(params.page || "1"));
  const limit = 24;
  const skip = (page - 1) * limit;

  const [anime, total] = await Promise.all([
    Series.find(filter).sort(sort).skip(skip).limit(limit).populate("genres", "name").lean(),
    Series.countDocuments(filter),
  ]);

  return { anime, total, page, totalPages: Math.ceil(total / limit) };
}

async function getGenres() {
  await connectDB();
  return Genre.find().sort({ name: 1 }).lean();
}

export default async function AnimePage({ searchParams }: Props) {
  const params = await searchParams;
  const [{ anime, total, page, totalPages }, genres] = await Promise.all([
    getAnime(params),
    getGenres(),
  ]);

  return (
    <div className="px-4 md:px-8 lg:px-12 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-1">Anime</h1>
        <p className="text-gray-400 text-sm">{total} series available</p>
      </div>
      <BrowseFilters genres={serialize(genres)} currentParams={params} basePath="/anime" showStatus />
      <MovieGrid items={serialize(anime)} type="series" page={page} totalPages={totalPages} basePath="/anime" currentParams={params} />
    </div>
  );
}
