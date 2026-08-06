const ANIMESALT_HOSTS = new Set([
  "animesalt.ac",
  "www.animesalt.ac",
  "animesalt.link",
  "www.animesalt.link",
]);

const ANIMESALT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function assertAnimeSaltUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !ANIMESALT_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("AnimeSalt URL must use an approved AnimeSalt domain.");
  }
  return url;
}

function extractSlug(sourceUrl: string) {
  const url = assertAnimeSaltUrl(sourceUrl);
  const parts = url.pathname.split("/").filter(Boolean);
  const typeIndex = parts.findIndex((part) => part === "series" || part === "episode");
  if (typeIndex < 0 || !parts[typeIndex + 1]) {
    throw new Error("Use an AnimeSalt series URL, such as https://animesalt.link/series/anime-name/.");
  }

  const rawSlug = parts[typeIndex + 1];
  if (parts[typeIndex] === "series") return rawSlug;

  const episodeSlug = rawSlug.replace(/-\d+x\d+\/?$/i, "");
  if (!episodeSlug) {
    throw new Error("The AnimeSalt episode URL has an invalid slug.");
  }
  return episodeSlug;
}

export function buildAnimeSaltEpisodeUrl(
  sourceUrl: string,
  season: number,
  episode: number
) {
  const source = assertAnimeSaltUrl(sourceUrl);
  const slug = extractSlug(source.toString());
  return `${source.origin}/episode/${slug}-${season}x${episode}/`;
}

function extractIframeUrl(html: string, pageUrl: string) {
  const iframeTags = html.match(/<iframe\b[^>]*>/gi) ?? [];
  const candidates: string[] = [];

  for (const tag of iframeTags) {
    const dataSrc = tag.match(/\bdata-src\s*=\s*["']([^"']+)["']/i)?.[1];
    const src = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    if (dataSrc) candidates.push(dataSrc);
    if (src) candidates.push(src);
  }

  const iframeUrl = candidates
    .map((value) => {
      try {
        return new URL(value, pageUrl);
      } catch {
        return null;
      }
    })
    .find((url) => url?.protocol === "https:" && /^as-cdn\d+\.top$/i.test(url.hostname));

  if (!iframeUrl) {
    throw new Error("No AnimeSalt video iframe was found for this episode.");
  }

  return iframeUrl.toString();
}

export async function scrapeAnimeSaltEpisode(
  sourceUrl: string,
  season: number,
  episode: number
) {
  const episodeUrl = buildAnimeSaltEpisodeUrl(sourceUrl, season, episode);
  const response = await fetch(episodeUrl, {
    headers: {
      "User-Agent": ANIMESALT_USER_AGENT,
      Referer: "https://cinevo.nl/",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`AnimeSalt episode page returned HTTP ${response.status}.`);
  }

  const html = await response.text();
  return {
    sourceUrl: response.url,
    videoUrl: extractIframeUrl(html, response.url),
  };
}
