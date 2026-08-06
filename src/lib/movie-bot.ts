/**
 * Movie Upload Bot — enterprise-grade auto-discovery worker.
 *
 * Core design principles:
 *
 * 1. IN-MEMORY KNOWN-ID SET
 *    All existing Movie.externalId values are loaded into a module-level Set<string>
 *    at startup and refreshed every 5 minutes. Duplicate checks are O(1) lookups —
 *    no DB round-trip per movie.
 *
 * 2. BATCH PAGE SCAN WITH SKIP-AHEAD
 *    Each tick fetches a full TMDB page (20 movies) and filters out all known IDs
 *    instantly. If the entire page is already in the database, the cursor advances
 *    immediately and the next page is tried in the SAME tick — no 10-second wait
 *    per duplicate page.
 *
 * 3. CLEAN HISTORY
 *    BotJob entries are only created for actual uploads and genuine failures.
 *    Duplicate skips are silent — they just advance the cursor and update the
 *    stat counter. No noise in the upload history.
 *
 * 4. SMART SOURCE ORDER
 *    "Upcoming" and "Now Playing" are tried first — these have the freshest content
 *    least likely to already be in the database.
 */

import { connectDB } from "@/lib/db";
import { verifyMovieWithAI } from "@/lib/groq-client";
import { generateSlug } from "@/lib/utils";
import type { BotDiscoverySource, TMDBDiscoveryResult } from "@/lib/external-api";

// ── Constants ─────────────────────────────────────────────────────────────────
const TICK_MS = 10_000;
const GLOBAL_KEY = "__sarrows_movie_bot__";
const LOCK_KEY = "__sarrows_movie_bot_lock__";
const VIDNEST_BASE = "https://vidnest.fun/movie";
const MAX_PAGES_PER_SOURCE = 20;
const MAX_SKIP_PAGES_PER_TICK = 10; // how many all-duplicate pages we'll skip in one tick

// ── In-memory known-ID set ────────────────────────────────────────────────────
// Populated from DB once at startup; refreshed every 5 minutes.
// All duplicate checks are O(1) lookups against this set.
const knownExternalIds = new Set<string>();
let knownIdsLoadedAt = 0;
const KNOWN_IDS_TTL = 5 * 60 * 1000; // 5 minutes

async function refreshKnownIds(Movie: any) {
  const now = Date.now();
  if (knownIdsLoadedAt && now - knownIdsLoadedAt < KNOWN_IDS_TTL) return;

  const docs = await Movie.find({}, { externalId: 1, _id: 0 }).lean();
  knownExternalIds.clear();
  for (const d of docs as any[]) {
    if (d.externalId) knownExternalIds.add(d.externalId);
  }
  knownIdsLoadedAt = now;
  console.log(`[MovieBot] Known-ID set refreshed — ${knownExternalIds.size} movies in DB`);
}

// ── Page cache ────────────────────────────────────────────────────────────────
let pageCache: {
  source: string;
  page: number;
  data: TMDBDiscoveryResult;
  fetchedAt: number;
} | null = null;
const PAGE_CACHE_TTL = 60 * 60 * 1000;

// ── Source labels ─────────────────────────────────────────────────────────────
const SOURCE_LABEL: Record<string, string> = {
  upcoming:      "Upcoming",
  now_playing:   "Now Playing",
  trending_day:  "Trending Today",
  trending_week: "Trending This Week",
  top_rated:     "Top Rated",
  popular:       "Popular",
};

// ── Tick ──────────────────────────────────────────────────────────────────────
async function tick() {
  if ((global as any)[LOCK_KEY]) return;
  (global as any)[LOCK_KEY] = true;

  try {
    await connectDB();

    const { default: BotConfig } = await import("@/models/BotConfig");
    const { default: BotJob }    = await import("@/models/BotJob");
    const { default: Movie }     = await import("@/models/Movie");
    const { default: Genre }     = await import("@/models/Genre");
    const { fetchTMDBDiscoveryPage, getTMDBMovieDetails } = await import("@/lib/external-api");

    // ── 1. Check enabled ───────────────────────────────────────────────────
    const cfg = await BotConfig.findById("singleton").lean<any>();
    if (!cfg?.enabled) return;

    // ── 2. Refresh known-ID set ────────────────────────────────────────────
    await refreshKnownIds(Movie);

    const sources: BotDiscoverySource[] = cfg.sources?.length
      ? cfg.sources
      : ["upcoming", "now_playing", "trending_day", "trending_week", "top_rated", "popular"];

    let sourceIdx: number  = cfg.currentSourceIdx ?? 0;
    let page: number       = cfg.currentPage ?? 1;
    let movieIdx: number   = cfg.currentMovieIdx ?? 0;

    // ── 3. Page-scan loop (skip all-duplicate pages in the same tick) ──────
    let skippedPages = 0;
    let foundMovie: any = null;

    while (!foundMovie && skippedPages <= MAX_SKIP_PAGES_PER_TICK) {
      const source = sources[sourceIdx % sources.length] as BotDiscoverySource;

      // Load page from cache or TMDB
      const cacheHit =
        pageCache &&
        pageCache.source === source &&
        pageCache.page === page &&
        Date.now() - pageCache.fetchedAt < PAGE_CACHE_TTL;

      if (!cacheHit) {
        const data = await fetchTMDBDiscoveryPage(source, page);
        pageCache = { source, page, data, fetchedAt: Date.now() };
        if (!data.results.length) {
          // Source exhausted — advance to next source
          sourceIdx = (sourceIdx + 1) % sources.length;
          page = 1; movieIdx = 0; pageCache = null;
          skippedPages++;
          await BotConfig.updateOne(
            { _id: "singleton" },
            { $set: { currentSourceIdx: sourceIdx, currentPage: page, currentMovieIdx: movieIdx } }
          );
          continue;
        }
        console.log(`[MovieBot] Loaded TMDB ${SOURCE_LABEL[source] ?? source} p.${page} — ${data.results.length} movies`);
      }

      const { results, totalPages } = pageCache!.data;

      // Filter page against in-memory set — O(n) where n=20
      const unknowns = results.slice(movieIdx).filter(m => !knownExternalIds.has(m.externalId));

      if (unknowns.length === 0) {
        // Entire remaining page is known — advance
        const nextPage = page + 1;
        if (nextPage > totalPages || nextPage > MAX_PAGES_PER_SOURCE) {
          // Source exhausted
          sourceIdx = (sourceIdx + 1) % sources.length;
          page = 1; movieIdx = 0; pageCache = null;
          console.log(`[MovieBot] Source "${SOURCE_LABEL[source]}" exhausted → switching to "${SOURCE_LABEL[sources[sourceIdx % sources.length]]}"`);
        } else {
          page = nextPage; movieIdx = 0; pageCache = null;
          console.log(`[MovieBot] Page ${page - 1} all known → advancing to page ${page}`);
        }
        skippedPages++;
        await BotConfig.updateOne(
          { _id: "singleton" },
          { $set: { currentSourceIdx: sourceIdx, currentPage: page, currentMovieIdx: movieIdx } }
        );
        continue;
      }

      // Found at least one new movie on this page
      foundMovie = unknowns[0];

      // Advance cursor past this movie's position in the page
      const posInPage = results.findIndex(m => m.externalId === foundMovie.externalId);
      const nextMovieIdx = posInPage + 1;

      if (nextMovieIdx >= results.length) {
        // Last movie on page — advance page next tick
        const nextPage = page + 1;
        if (nextPage > totalPages || nextPage > MAX_PAGES_PER_SOURCE) {
          sourceIdx = (sourceIdx + 1) % sources.length;
          await BotConfig.updateOne(
            { _id: "singleton" },
            { $set: { currentSourceIdx: sourceIdx, currentPage: 1, currentMovieIdx: 0 } }
          );
        } else {
          await BotConfig.updateOne(
            { _id: "singleton" },
            { $set: { currentPage: nextPage, currentMovieIdx: 0 } }
          );
        }
        pageCache = null;
      } else {
        await BotConfig.updateOne(
          { _id: "singleton" },
          { $set: { currentMovieIdx: nextMovieIdx } }
        );
      }
    }

    if (!foundMovie) {
      console.log(`[MovieBot] All sources fully scanned — cycling back to start`);
      await BotConfig.updateOne(
        { _id: "singleton" },
        { $set: { currentSourceIdx: 0, currentPage: 1, currentMovieIdx: 0 } }
      );
      return;
    }

    // ── 4. Release-date gate — skip unreleased movies entirely ────────────
    // TMDB sends the exact release_date for every movie. We use that as the
    // authoritative source — much more reliable than asking the AI.
    const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const releaseDate = foundMovie.releaseDate ?? null;

    if (!releaseDate || releaseDate > todayStr) {
      // Movie hasn't been released yet — add to known set so we never revisit
      // it during this session, but don't upload and don't create a BotJob.
      knownExternalIds.add(foundMovie.externalId);
      console.log(
        `[MovieBot] Skipping "${foundMovie.title}" — not yet released` +
          (releaseDate ? ` (releases ${releaseDate})` : " (no release date)")
      );
      return;
    }

    // ── 5. Add to known set immediately (prevents re-processing this ID) ───
    knownExternalIds.add(foundMovie.externalId);

    const currentSource = sources[sourceIdx % sources.length];
    console.log(`[MovieBot] Processing "${foundMovie.title}" (TMDB ${foundMovie.externalId}) from ${SOURCE_LABEL[currentSource] ?? currentSource}`);

    // ── 6. Fetch full TMDB details ─────────────────────────────────────────
    let genreNames: string[] = [];
    let cast: any[] = [];
    let trailerUrl: string | null = null;
    let duration: number | null = null;
    try {
      const details = await getTMDBMovieDetails(foundMovie.externalId);
      if (details) {
        genreNames = details.genreNames ?? [];
        cast       = details.cast ?? [];
        trailerUrl = details.trailerUrl ?? null;
        duration   = details.duration ?? null;
      }
    } catch (e: any) {
      console.warn(`[MovieBot] TMDB detail fetch failed for ${foundMovie.externalId}:`, e?.message);
    }

    // ── 7. Build VidNest embed URL (same as admin panel) ──────────────────
    const videoUrl  = `${VIDNEST_BASE}/${foundMovie.externalId}`;
    const videoType = "embed";

    // ── 8. AI verification ─────────────────────────────────────────────────
    const aiResult = await verifyMovieWithAI({
      title:       foundMovie.title,
      description: foundMovie.description,
      releaseYear: foundMovie.releaseYear,
      cast:        cast.slice(0, 5),
      videoUrl,
      posterUrl:   foundMovie.posterUrl ?? undefined,
      genreNames,
    });

    const finalTitle = aiResult.correctedTitle && aiResult.confidence >= 70
      ? aiResult.correctedTitle : foundMovie.title;
    const finalYear  = aiResult.correctedYear  && aiResult.confidence >= 70
      ? aiResult.correctedYear  : foundMovie.releaseYear;

    // ── 9. Resolve/create genres ──────────────────────────────────────────
    let genreIds: any[] = [];
    if (genreNames.length) {
      const existing = await Genre.find({
        name: { $in: genreNames.map(n => new RegExp(`^${n}$`, "i")) },
      }).select("_id name").lean() as any[];

      const foundNames = new Set(existing.map((g: any) => g.name.toLowerCase()));
      const missing    = genreNames.filter(n => !foundNames.has(n.toLowerCase()));

      let created: any[] = [];
      if (missing.length) {
        created = await Genre.insertMany(
          missing.map(name => ({ name, slug: generateSlug(name) })),
          { ordered: false }
        ).catch(() => []) as any[];
      }
      genreIds = [...existing.map((g: any) => g._id), ...created.map((g: any) => g._id)];
    }

    // ── 10. Final title-duplicate safety check (AI may have corrected it) ──
    const candidateSlug = generateSlug(finalTitle);
    const slugExists = await Movie.findOne({ slug: candidateSlug }).select("_id").lean();
    let slug = slugExists ? generateSlug(finalTitle, Date.now().toString()) : candidateSlug;

    // ── 11. Create Movie ──────────────────────────────────────────────────
    const movie = await Movie.create({
      title:       finalTitle,
      slug,
      description: aiResult.correctedDescription || foundMovie.description || "",
      posterUrl:   foundMovie.posterUrl  || "",
      bannerUrl:   foundMovie.bannerUrl  || "",
      trailerUrl:  trailerUrl || "",
      videoUrl,
      videoType,
      externalId:  foundMovie.externalId,
      duration:    duration ?? undefined,
      releaseYear: finalYear ?? undefined,
      genres:      genreIds,
      cast,
      rating:      foundMovie.rating ? parseFloat(foundMovie.rating.toFixed(1)) : 0,
      status:      "published",
    });

    // ── 12. Log to BotJob (uploads + failures only, never duplicates) ─────
    await BotJob.create({
      title:           movie.title,
      externalId:      foundMovie.externalId,
      videoUrl,
      videoType,
      posterUrl:       foundMovie.posterUrl || "",
      genreNames,
      releaseYear:     finalYear,
      status:          "done",
      source:          currentSource,
      movieId:         movie._id,
      movieSlug:       movie.slug,
      aiVerified:      true,
      aiConfidence:    aiResult.confidence,
      aiNotes:         aiResult.notes,
      aiIssues:        aiResult.issues,
      aiCorrectedTitle: aiResult.correctedTitle ?? null,
      aiCorrectedYear:  aiResult.correctedYear  ?? null,
      processedAt:     new Date(),
    });

    // ── 13. Update stats ──────────────────────────────────────────────────
    await BotConfig.updateOne(
      { _id: "singleton" },
      {
        $inc: { uploadedCount: 1 },
        $set: { lastActivity: new Date(), lastUploadedTitle: movie.title, lastError: null },
      }
    );

    // Revalidate Next.js cache paths
    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/"); revalidatePath("/home"); revalidatePath("/movies");
    } catch {}

    // Push notification (non-blocking)
    import("@/lib/notifications")
      .then(({ notifyNewContent }) =>
        notifyNewContent("movie", {
          id:          movie._id.toString(),
          slug:        movie.slug,
          title:       movie.title,
          description: movie.description,
          posterUrl:   movie.posterUrl,
          bannerUrl:   movie.bannerUrl,
        })
      )
      .catch(() => {});

    console.log(`[MovieBot] ✓ Uploaded "${movie.title}" → /movies/${movie.slug}`);

  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error("[MovieBot] Tick error:", msg);
    try {
      const { default: BotConfig } = await import("@/models/BotConfig");
      await BotConfig.updateOne(
        { _id: "singleton" },
        { $inc: { failedCount: 1 }, $set: { lastActivity: new Date(), lastError: msg } }
      );
    } catch {}
  } finally {
    (global as any)[LOCK_KEY] = false;
  }
}

// ── Public initialiser ────────────────────────────────────────────────────────
export function initMovieBot() {
  if ((global as any)[GLOBAL_KEY]) return;
  (global as any)[GLOBAL_KEY] = setInterval(tick, TICK_MS);
  console.log(`[MovieBot] Worker started — smart auto-discovery every ${TICK_MS / 1000}s`);
}
