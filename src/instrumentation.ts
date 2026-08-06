/**
 * Next.js Instrumentation Hook — runs once on server startup.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * We use this to boot the Movie Bot background worker so it is always
 * running regardless of whether any HTTP request has come in.
 */
export async function register() {
  // Only run in the Node.js runtime, not in the edge runtime or during
  // the build step.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initMovieBot } = await import("@/lib/movie-bot");
    initMovieBot();
  }
}
