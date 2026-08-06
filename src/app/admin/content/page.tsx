export const dynamic = "force-dynamic";

import AdminContentClient from "@/components/admin/AdminContentClient";
import { connectDB } from "@/lib/db";
import Movie from "@/models/Movie";
import Series from "@/models/Series";
import Genre from "@/models/Genre";

async function getData() {
  await connectDB();
  const [movies, anime, webSeries, genres] = await Promise.all([
    Movie.find().select("+videoUrl +videoType").sort({ createdAt: -1 }).limit(10).populate("genres", "name").lean(),
    Series.find({ type: "anime" }).sort({ createdAt: -1 }).limit(10).populate("genres", "name").lean(),
    Series.find({ type: "series" }).sort({ createdAt: -1 }).limit(10).populate("genres", "name").lean(),
    Genre.find().sort({ name: 1 }).lean(),
  ]);
  return { movies, anime, webSeries, genres };
}

export default async function AdminContentPage() {
  const { movies, anime, webSeries, genres } = await getData();
  return (
    <AdminContentClient
      movies={JSON.parse(JSON.stringify(movies))}
      anime={JSON.parse(JSON.stringify(anime))}
      webSeries={JSON.parse(JSON.stringify(webSeries))}
      genres={JSON.parse(JSON.stringify(genres))}
    />
  );
}
