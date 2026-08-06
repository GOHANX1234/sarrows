import Groq from "groq-sdk";

let _client: Groq | null = null;

function getClient(): Groq {
  if (!_client) {
    const apiKey = process.env.GROQ_API;
    if (!apiKey) throw new Error("GROQ_API environment variable is not set");
    _client = new Groq({ apiKey });
  }
  return _client;
}

export interface MovieVerificationInput {
  title: string;
  description?: string;
  releaseYear?: number | null;
  cast?: Array<{ name: string; character?: string }>;
  videoUrl?: string;
  posterUrl?: string;
  genreNames?: string[];
}

export interface MovieVerificationResult {
  verified: boolean;
  confidence: number; // 0–100
  issues: string[];
  correctedTitle?: string;
  correctedYear?: number;
  correctedDescription?: string;
  notes: string;
  isDuplicate: boolean;
  duplicateReason?: string;
  qualityScore: number; // 0–100 overall metadata quality
}

const SYSTEM_PROMPT = `You are an expert movie database quality-assurance bot for a streaming platform called Sarrows.
Your job is to verify movie metadata submitted for auto-upload, catch errors, suggest corrections, and flag likely duplicates.

Rules:
- Be precise and factual. Do not invent information.
- Flag issues clearly: wrong year, misspelled title, suspicious or missing videoUrl, low-quality description, etc.
- If the title looks like a well-known movie, validate the year against your knowledge.
- A "duplicate" means this is extremely likely to already exist in the database under the same or very similar title.
- "confidence" reflects how certain you are the metadata is accurate (0 = total guess, 100 = verified factual).
- "qualityScore" reflects overall metadata completeness and accuracy.
- Always respond with valid JSON only — no markdown fences, no extra text.`;

const USER_PROMPT_TEMPLATE = (input: MovieVerificationInput) => `
Verify this movie entry for our streaming platform database:

Title: ${input.title}
Release Year: ${input.releaseYear ?? "unknown"}
Description: ${input.description ? input.description.slice(0, 500) : "not provided"}
Genres: ${input.genreNames?.join(", ") || "not provided"}
Cast (first 5): ${input.cast?.slice(0, 5).map((c) => `${c.name}${c.character ? ` as ${c.character}` : ""}`).join(", ") || "not provided"}
Video URL provided: ${input.videoUrl ? "yes" : "no"}
Poster URL provided: ${input.posterUrl ? "yes" : "no"}

Respond with this exact JSON structure:
{
  "verified": true or false,
  "confidence": 0-100,
  "qualityScore": 0-100,
  "isDuplicate": true or false,
  "duplicateReason": "string or null",
  "correctedTitle": "string or null (only if title has a clear error)",
  "correctedYear": number or null (only if year is clearly wrong),
  "correctedDescription": "string or null (only if you can provide a better brief description)",
  "issues": ["array of issue strings"],
  "notes": "short summary of your assessment"
}
`;

/**
 * Calls Groq to verify and enrich a movie entry before it is saved.
 * Returns a safe default (verified=true, low confidence) on API failure
 * so a single Groq outage doesn't stall the entire queue.
 */
export async function verifyMovieWithAI(
  input: MovieVerificationInput
): Promise<MovieVerificationResult> {
  try {
    const client = getClient();

    const completion = await client.chat.completions.create({
      model: "qwen/qwen3.6-27b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: USER_PROMPT_TEMPLATE(input) },
      ],
      temperature: 0.1,
      max_tokens: 600,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);

    return {
      verified: Boolean(parsed.verified),
      confidence: Number(parsed.confidence ?? 50),
      qualityScore: Number(parsed.qualityScore ?? 50),
      isDuplicate: Boolean(parsed.isDuplicate),
      duplicateReason: parsed.duplicateReason ?? undefined,
      correctedTitle: parsed.correctedTitle ?? undefined,
      correctedYear: parsed.correctedYear ?? undefined,
      correctedDescription: parsed.correctedDescription ?? undefined,
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      notes: String(parsed.notes ?? ""),
    };
  } catch (err: any) {
    // Graceful degradation — log and continue without blocking the queue
    console.error("[MovieBot] Groq verification failed:", err?.message ?? err);
    return {
      verified: true,
      confidence: 0,
      qualityScore: 0,
      isDuplicate: false,
      issues: [`AI verification unavailable: ${err?.message ?? "unknown error"}`],
      notes: "AI verification skipped due to API error. Metadata was uploaded as-is.",
    };
  }
}
