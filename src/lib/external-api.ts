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

/** Fetch the YouTube trailer URL for a TMDB movie. Prefers official trailers; falls back to any YouTube trailer. */
async function getTMDBMovieTrailer(id: string): Promise<string | null> {
  const data = await tmdbFetch<{ results: { site: string; type: string; key: string; official: boolean }[] }>(
    `/movie/${id}/videos`
  );
  const videos = data?.results ?? [];
  const youtubeTrailers = videos.filter((v) => v.site === "YouTube" && v.type === "Trailer");
  const pick = youtubeTrailers.find((v) => v.official) ?? youtubeTrailers[0] ?? null;
  return pick ? `https://www.youtube.com/watch?v=${pick.key}` : null;
}

/** Fetch the YouTube trailer URL for a TMDB TV series. Prefers official trailers; falls back to any YouTube trailer. */
async function getTMDBSeriesTrailer(id: string): Promise<string | null> {
  const data = await tmdbFetch<{ results: { site: string; type: string; key: string; official: boolean }[] }>(
    `/tv/${id}/videos`
  );
  const videos = data?.results ?? [];
  const youtubeTrailers = videos.filter((v) => v.site === "YouTube" && v.type === "Trailer");
  const pick = youtubeTrailers.find((v) => v.official) ?? youtubeTrailers[0] ?? null;
  return pick ? `https://www.youtube.com/watch?v=${pick.key}` : null;
}

/** Fetch runtime + genre names + cast + trailer for a specific TMDB movie (only available on the detail endpoint, not search). */
export async function getTMDBMovieDetails(id: string) {
  const [movie, cast, trailerUrl] = await Promise.all([
    getTMDBMovie(id),
    getTMDBMovieCredits(id),
    getTMDBMovieTrailer(id),
  ]);
  if (!movie) return null;
  return {
    duration: movie.runtime ? movie.runtime * 60 : null,
    genreNames: (movie.genres ?? []).map((g) => g.name),
    cast,
    trailerUrl,
  };
}

/** Fetch genre names + cast + trailer for a specific TMDB TV series (detail endpoint only, not search). */
export async function getTMDBSeriesDetails(id: string) {
  const [detail, cast, trailerUrl] = await Promise.all([
    tmdbFetch<TMDBSeries & { genres: { id: number; name: string }[] }>(`/tv/${id}`),
    getTMDBSeriesCredits(id),
    getTMDBSeriesTrailer(id),
  ]);
  if (!detail) return null;
  return {
    genreNames: (detail.genres ?? []).map((g) => g.name),
    cast,
    trailerUrl,
  };
}

/** Fetch episode title for a specific TMDB TV series episode. */
export async function getTMDBEpisodeTitle(
  tmdbId: string,
  season: number,
  episode: number
): Promise<string | null> {
  const data = await tmdbFetch<{ name: string }>(
    `/tv/${tmdbId}/season/${season}/episode/${episode}`
  );
  return data?.name ?? null;
}

/** Fetch top-billed cast for a specific TMDB TV series. */
export async function getTMDBSeriesCredits(id: string) {
  const data = await tmdbFetch<{ cast: TMDBCastMember[] }>(`/tv/${id}/credits`);
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

export { TMDB_IMG, TMDB_IMG_ORIGINAL };

// ─── Bot Auto-Discovery ────────────────────────────────────────────────────

export type BotDiscoverySource =
  | "popular"
  | "trending_day"
  | "trending_week"
  | "top_rated"
  | "now_playing"
  | "upcoming";

const SOURCE_PATH: Record<BotDiscoverySource, string> = {
  popular: "/movie/popular",
  trending_day: "/trending/movie/day",
  trending_week: "/trending/movie/week",
  top_rated: "/movie/top_rated",
  now_playing: "/movie/now_playing",
  upcoming: "/movie/upcoming",
};

export interface TMDBDiscoveryResult {
  results: Array<{
    externalId: string;
    title: string;
    description: string;
    posterUrl: string | null;
    bannerUrl: string | null;
    releaseDate: string | null; // full ISO date string e.g. "2024-03-15"
    releaseYear: number | null;
    rating: number;
  }>;
  totalPages: number;
}

/**
 * Fetch one page of movies from a TMDB discovery list.
 * Used by the Movie Bot to auto-discover content.
 */
export async function fetchTMDBDiscoveryPage(
  source: BotDiscoverySource,
  page: number
): Promise<TMDBDiscoveryResult> {
  const path = SOURCE_PATH[source] ?? SOURCE_PATH.popular;
  const data = await tmdbFetch<{ results: TMDBMovie[]; total_pages: number }>(
    path,
    { page: String(page) }
  );
  if (!data) return { results: [], totalPages: 1 };

  return {
    totalPages: Math.min(data.total_pages ?? 1, 20), // cap at page 20
    results: (data.results ?? []).map((m) => ({
      externalId: m.id.toString(),
      title: m.title,
      description: m.overview,
      posterUrl: m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null,
      bannerUrl: m.backdrop_path ? `${TMDB_IMG_ORIGINAL}${m.backdrop_path}` : null,
      releaseDate: m.release_date || null,
      releaseYear: m.release_date ? parseInt(m.release_date.split("-")[0]) : null,
      rating: m.vote_average,
    })),
  };
}

// ─── AniList (GraphQL) ────────────────────────────────────────────────────
// Free, no API key required. Rate limit: 90 req/min.
const ANILIST_BASE = "https://graphql.anilist.co";

/** Strip HTML tags and decode common HTML entities from AniList descriptions. */
function stripHtml(str: string): string {
  return str
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .trim();
}

async function anilistQuery<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T | null> {
  try {
    const res = await fetch(ANILIST_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.errors) return null;
    return json.data as T;
  } catch {
    return null;
  }
}

interface AnilistMedia {
  id: number;
  title: { english: string | null; romaji: string };
  description: string | null;
  coverImage: { large: string | null };
  bannerImage: string | null;
  startDate: { year: number | null };
  averageScore: number | null; // 0–100
  episodes: number | null;
  status: string | null;
  genres: string[];
}

interface AnilistCharEdge {
  role: string;
  node: { name: { full: string }; image: { medium: string | null } };
  voiceActors: { name: { full: string }; image: { medium: string | null } }[];
}

/** Search AniList for anime by title. Returns up to 10 results. */
export async function searchAnilistAnime(query: string) {
  const gql = `
    query ($search: String) {
      Page(perPage: 10) {
        media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
          id
          title { english romaji }
          description(asHtml: false)
          coverImage { large }
          bannerImage
          startDate { year }
          averageScore
          episodes
          status
          genres
        }
      }
    }
  `;
  const data = await anilistQuery<{ Page: { media: AnilistMedia[] } }>(gql, { search: query });
  return (data?.Page?.media ?? []).map((a) => ({
    externalId: a.id.toString(),
    title: a.title.english || a.title.romaji,
    description: a.description ? stripHtml(a.description) : "",
    posterUrl: a.coverImage?.large || null,
    bannerUrl: a.bannerImage || a.coverImage?.large || null,
    releaseYear: a.startDate?.year || null,
    // AniList scores are 0–100; normalise to 0–10 to match TMDB/our schema
    rating: a.averageScore ? parseFloat((a.averageScore / 10).toFixed(1)) : null,
    episodes: a.episodes || null,
    genreNames: a.genres ?? [],
  }));
}

/**
 * Fetch the cast for a specific AniList anime (by AniList ID), in the same
 * { name, character, image } shape used elsewhere: `name` is the Japanese
 * voice actor (falls back to the character name if none is credited) and
 * `character` is the character they play.
 */
export async function getAnilistAnimeCharacters(id: string) {
  const gql = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        characters(sort: [ROLE, RELEVANCE], perPage: 15) {
          edges {
            role
            node {
              name { full }
              image { medium }
            }
            voiceActors(language: JAPANESE) {
              name { full }
              image { medium }
            }
          }
        }
      }
    }
  `;
  const data = await anilistQuery<{ Media: { characters: { edges: AnilistCharEdge[] } } }>(
    gql,
    { id: parseInt(id, 10) }
  );
  return (data?.Media?.characters?.edges ?? [])
    .slice(0, 15)
    .map((edge, i) => {
      const charName = edge.node?.name?.full || "";
      const va = edge.voiceActors?.[0];
      return {
        name: va?.name?.full || charName,
        character: va ? charName : edge.role || "",
        image: va?.image?.medium || edge.node?.image?.medium || "",
        order: i,
      };
    })
    .filter((c) => c.name);
}

/**
 * AniList does not expose per-episode titles by episode number through its
 * public API. This function always returns null — enter episode titles manually
 * or leave them blank.
 */
export async function getAnilistEpisodeTitle(
  _id: string,
  _episodeNumber: number
): Promise<null> {
  return null;
}

// ─── Legacy aliases (kept so any existing callers aren't broken) ───────────
/** @deprecated Use searchAnilistAnime instead. */
export const searchJikanAnime = searchAnilistAnime;
/** @deprecated Use getAnilistAnimeCharacters instead. */
export const getJikanAnimeCharacters = getAnilistAnimeCharacters;
/** @deprecated Use getAnilistEpisodeTitle instead. */
export const getJikanEpisodeTitle = getAnilistEpisodeTitle;
