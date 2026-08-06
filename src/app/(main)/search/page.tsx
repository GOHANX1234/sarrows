export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/db";
import Movie from "@/models/Movie";
import "@/models/Genre";
import Series from "@/models/Series";
import SearchResults from "@/components/search/SearchResults";
import { escapeRegex, serialize } from "@/lib/utils";
import { Search } from "lucide-react";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

async function search(query: string) {
  if (!query || query.trim().length < 2) return { movies: [], series: [] };
  const safeQuery = escapeRegex(query.trim().slice(0, 100));
  await connectDB();

  const searchRegex = new RegExp(safeQuery, "i");
  const filter = { $or: [{ title: searchRegex }, { description: searchRegex }] };

  const [movies, series] = await Promise.all([
    Movie.find({ ...filter, status: "published" })
      .populate("genres", "name")
      .limit(24)
      .lean(),
    Series.find({ ...filter, publishStatus: "published" })
      .populate("genres", "name")
      .limit(24)
      .lean(),
  ]);

  return { movies, series };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const { movies, series } = await search(q || "");

  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 max-w-screen-xl mx-auto">
      {/* Page heading */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none"
          style={{ background: "rgba(229,9,20,0.15)", border: "1px solid rgba(229,9,20,0.25)" }}>
          <Search className="w-4 h-4 text-sarrows-red" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
            {q ? `"${q}"` : "Search"}
          </h1>
          {q && (
            <p className="text-gray-500 text-xs mt-0.5">
              {movies.length + series.length} result{movies.length + series.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <SearchResults
        movies={serialize(movies)}
        series={serialize(series)}
        query={q || ""}
      />
    </div>
  );
}
