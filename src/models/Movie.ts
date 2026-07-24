import mongoose, { Schema } from "mongoose";

const MovieSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true, index: true },
    description: String,
    posterUrl: String,
    bannerUrl: String,
    trailerUrl: String,
    // Never returned by a plain query/lean() — callers must opt in with
    // `.select("+videoUrl")`. This stops the real CDN link from leaking through
    // list/search/detail endpoints that don't need it (playback goes through
    // /api/stream/movie/[id] instead).
    videoUrl: { type: String, select: false },
    // Explicit override for how to treat videoUrl when it doesn't carry a
    // recognizable file extension (many CDN links don't). Defaults to
    // extension-sniffing ("auto") if not set.
    videoType: { type: String, enum: ["auto", "hls", "direct", "embed"], default: "auto", select: false },
    externalId: String,
    duration: Number,
    releaseYear: Number,
    genres: [{ type: Schema.Types.ObjectId, ref: "Genre" }],
    cast: [
      {
        name: { type: String, required: true },
        character: String,
        image: String,
        order: Number,
      },
    ],
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    status: { type: String, enum: ["published", "draft"], default: "draft" },
  },
  { timestamps: true }
);

MovieSchema.index({ title: "text", description: "text" });
MovieSchema.index({ genres: 1, releaseYear: -1 });
MovieSchema.index({ views: -1 });
MovieSchema.index({ rating: -1 });

const Movie = mongoose.models.Movie || mongoose.model("Movie", MovieSchema);
export default Movie;
