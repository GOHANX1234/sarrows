const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_KEY = process.env.TMDB_API_KEY || "";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_IMG_ORIGINAL = "https://image.tmdb.org/t/p/original";

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  genre_ids: number[];
  vote_average: number;
  runtime?: number;
}

export interface TMDBSeries {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  genre_ids: number[];
  vote_average: number;
  number_of_seasons?: number;
}

export interface TMDBMovieDetails extends TMDBMovie {
  genres?: { id: number; name: string }[];
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!TMDB_KEY) return null;
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", TMDB_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function searchTMDBMovies(query: string) {
  const data = await tmdbFetch<{ results: TMDBMovie[] }>("/search/movie", { query });
  return (data?.results ?? []).map((m) => ({
    externalId: m.id.toString(),
    title: m.title,
    description: m.overview,
    posterUrl: m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null,
    bannerUrl: m.backdrop_path ? `${TMDB_IMG_ORIGINAL}${m.backdrop_path}` : null,
    releaseYear: m.release_date ? parseInt(m.release_date.split("-")[0]) : null,
    rating: m.vote_average,
  }));
}

export async function searchTMDBSeries(query: string) {
  const data = await tmdbFetch<{ results: TMDBSeries[] }>("/search/tv", { query });
  return (data?.results ?? []).map((s) => ({
    externalId: s.id.toString(),
    title: s.name,
    description: s.overview,
    posterUrl: s.poster_path ? `${TMDB_IMG}${s.poster_path}` : null,
    bannerUrl: s.backdrop_path ? `${TMDB_IMG_ORIGINAL}${s.backdrop_path}` : null,
    releaseYear: s.first_air_date ? parseInt(s.first_air_date.split("-")[0]) : null,
    totalSeasons: s.number_of_seasons,
    rating: s.vote_average,
  }));
}

export async function getTMDBMovie(id: string) {
  return tmdbFetch<TMDBMovieDetails & { runtime: number }>(`/movie/${id}`);
}

export async function getTMDBSeries(id: string) {
  return tmdbFetch<TMDBSeries & { number_of_seasons: number }>(`/tv/${id}`);
}

interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

/** Fetch top-billed cast for a specific TMDB movie. */
export async function getTMDBMovieCredits(id: string) {
  const data = await tmdbFetch<{ cast: TMDBCastMember[] }>(`/movie/${id}/credits`);
  return (data?.cast ?? [])
    .sort((a, b) => a.order - b.order)
    .slice(0, 15)
    .map((c) => ({
      name: c.name,
      character: c.character || "",
      image: c.profile_path ? `${TMDB_IMG}${c.profile_path}` : "",
      order: c.order,
    }));
}

/** Fetch runtime + genre names + cast for a specific TMDB movie (only available on the detail endpoint, not search). */
export async function getTMDBMovieDetails(id: string) {
  const [movie, cast] = await Promise.all([getTMDBMovie(id), getTMDBMovieCredits(id)]);
  if (!movie) return null;
  return {
    duration: movie.runtime ? movie.runtime * 60 : null,
    genreNames: (movie.genres ?? []).map((g) => g.name),
    cast,
  };
}

export { TMDB_IMG, TMDB_IMG_ORIGINAL };

// ─── Jikan (MyAnimeList) ───────────────────────────────────────────────────
// Free, no API key required. Rate limit: 3 req/s.
const JIKAN_BASE = "https://api.jikan.moe/v4";

interface JikanAnime {
  mal_id: number;
  title: string;
  title_english: string | null;
  synopsis: string | null;
  images: { jpg: { large_image_url: string | null } };
  year: number | null;
  score: number | null;
  episodes: number | null;
  season: string | null;
  status: string | null;
  genres?: { mal_id: number; name: string }[];
}

async function jikanFetch<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  const url = new URL(`${JIKAN_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function searchJikanAnime(query: string) {
  const data = await jikanFetch<{ data: JikanAnime[] }>("/anime", { q: query, limit: "10", sfw: "true" });
  return (data?.data ?? []).map((a) => ({
    externalId: a.mal_id.toString(),
    title: a.title_english || a.title,
    description: a.synopsis || "",
    posterUrl: a.images?.jpg?.large_image_url || null,
    bannerUrl: a.images?.jpg?.large_image_url || null, // Jikan has no separate backdrop
    releaseYear: a.year || null,
    rating: a.score || null,
    episodes: a.episodes || null,
    genreNames: (a.genres ?? []).map((g) => g.name),
  }));
}

interface JikanCharacterEntry {
  character: {
    name: string;
    images: { jpg: { image_url: string | null } };
  };
  role: string;
  voice_actors?: {
    person: { name: string; images?: { jpg?: { image_url: string | null } } };
    language: string;
  }[];
}

/**
 * Fetch the cast for a specific Jikan (MyAnimeList) anime, in the same
 * { name, character, image } shape used for TMDB movie cast: `name` is the
 * voice actor (falls back to the character's own name if none is credited)
 * and `character` is the character they play.
 */
export async function getJikanAnimeCharacters(id: string) {
  const data = await jikanFetch<{ data: JikanCharacterEntry[] }>(`/anime/${id}/characters`);
  return (data?.data ?? [])
    .slice(0, 15)
    .map((entry, i) => {
      const characterName = entry.character?.name || "";
      const japaneseVA = entry.voice_actors?.find((va) => va.language === "Japanese");
      const anyVA = japaneseVA || entry.voice_actors?.[0];
      return {
        name: anyVA?.person?.name || characterName,
        character: anyVA ? characterName : entry.role || "",
        image: (anyVA ? anyVA.person?.images?.jpg?.image_url : null) || entry.character?.images?.jpg?.image_url || "",
        order: i,
      };
    })
    .filter((c) => c.name);
}

/** Fetch a single anime episode's title from Jikan (MyAnimeList) by episode number. */
export async function getJikanEpisodeTitle(id: string, episodeNumber: number) {
  const data = await jikanFetch<{ data: { title?: string; title_japanese?: string; title_romanji?: string } }>(
    `/anime/${id}/episodes/${episodeNumber}`
  );
  const ep = data?.data;
  if (!ep) return null;
  return ep.title || ep.title_romanji || ep.title_japanese || null;
}
