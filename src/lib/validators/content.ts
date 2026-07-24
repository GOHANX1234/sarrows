import { z } from "zod";

export const castMemberSchema = z.object({
  name: z.string().min(1, "Cast member name is required").max(150),
  character: z.string().max(150).optional().or(z.literal("")),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  order: z.number().int().optional(),
});

export const movieSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  posterUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  bannerUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  trailerUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  videoType: z.enum(["auto", "hls", "direct", "embed"]).optional(),
  externalId: z.string().optional(),
  duration: z.number().int().positive().optional(),
  releaseYear: z.number().int().min(1888).max(new Date().getFullYear() + 5).optional(),
  genres: z.array(z.string()).optional(),
  cast: z.array(castMemberSchema).optional(),
  status: z.enum(["published", "draft"]).default("draft"),
  rating: z.number().min(0).max(10).optional(),
});

export const seriesSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  posterUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  bannerUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  externalId: z.string().optional(),
  totalSeasons: z.number().int().positive().optional(),
  releaseYear: z.number().int().min(1888).max(new Date().getFullYear() + 5).optional(),
  genres: z.array(z.string()).optional(),
  cast: z.array(castMemberSchema).optional(),
  status: z.enum(["ongoing", "completed"]).default("ongoing"),
  type: z.enum(["anime", "series"]).default("anime"),
  publishStatus: z.enum(["published", "draft"]).default("draft"),
  rating: z.number().min(0).max(10).optional(),
});

export const episodeSchema = z.object({
  series: z.string().min(1, "Series is required"),
  season: z.number().int().positive().default(1),
  episodeNumber: z.number().int().positive(),
  title: z.string().max(200).optional(),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  videoType: z.enum(["auto", "hls", "direct", "embed"]).optional(),
});

export const requestSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  type: z.enum(["movie", "series", "anime"], { errorMap: () => ({ message: "Type must be movie, series, or anime" }) }),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export const requestStatusSchema = z.object({
  status: z.enum(["pending", "in_progress", "fulfilled", "rejected"]),
  adminNote: z.string().max(500).optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  targetType: z.enum(["Movie", "Series"]),
  targetId: z.string().min(1),
  rating: z.number().int().min(1).max(10),
  comment: z.string().max(1000).optional(),
});

export type MovieInput = z.infer<typeof movieSchema>;
export type SeriesInput = z.infer<typeof seriesSchema>;
export type EpisodeInput = z.infer<typeof episodeSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
