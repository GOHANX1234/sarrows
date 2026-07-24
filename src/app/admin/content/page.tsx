export const dynamic = "force-dynamic";

import AdminContentClient from "@/components/admin/AdminContentClient";
import { connectDB } from "@/lib/db";
import Movie from "@/models/Movie";
import Series from "@/models/Series";
import Genre from "@/models/Genre";

async function getData() {
  await connectDB();
  const [movies, anime, genres] = await Promise.all([
    Movie.find().select("+videoUrl +videoType").sort({ createdAt: -1 }).populate("genres", "name").lean(),
    Series.find({ type: "anime" }).sort({ createdAt: -1 }).populate("genres", "name").lean(),
    Genre.find().sort({ name: 1 }).lean(),
  ]);
  return { movies, anime, genres };
}

export default async function AdminContentPage() {
  const { movies, anime, genres } = await getData();
  return (
    <AdminContentClient
      movies={JSON.parse(JSON.stringify(movies))}
      anime={JSON.parse(JSON.stringify(anime))}
      genres={JSON.parse(JSON.stringify(genres))}
    />
  );
}
