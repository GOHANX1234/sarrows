"use client";

/**
 * Resolves a list of genre names (e.g. from TMDB/Jikan autofill) to genre
 * document IDs, creating any missing genres on the fly via the admin API.
 * `existingGenres` is read (and extended locally) to avoid creating
 * duplicates within a single resolution pass; `onGenreCreated` lets the
 * caller sync newly created genres into its own state so they show up in
 * the genre picker immediately.
 */
export async function resolveGenreNames(
  names: string[],
  existingGenres: any[],
  onGenreCreated?: (genre: any) => void
): Promise<string[]> {
  const pool = [...existingGenres];
  const ids: string[] = [];

  for (const raw of names) {
    const name = raw?.trim();
    if (!name) continue;

    const match = pool.find((g) => g.name?.toLowerCase() === name.toLowerCase());
    if (match) {
      ids.push(match._id);
      continue;
    }

    try {
      const res = await fetch("/api/admin/genres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        pool.push(data.genre);
        ids.push(data.genre._id);
        onGenreCreated?.(data.genre);
      }
    } catch {
      // Skip this genre if creation fails; don't block the rest of the autofill.
    }
  }

  return ids;
}
