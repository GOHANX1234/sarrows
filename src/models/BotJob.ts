import mongoose, { Schema } from "mongoose";

/**
 * Audit log entry created by the bot for each movie it processes.
 * Status: done | duplicate | failed
 */
const BotJobSchema = new Schema(
  {
    title: { type: String, required: true },
    externalId: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    videoType: { type: String, default: "embed" },
    posterUrl: { type: String, default: "" },
    genreNames: { type: [String], default: [] },
    releaseYear: { type: Number, default: null },

    // ── Result ───────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["done", "failed", "duplicate"],
      default: "done",
      index: true,
    },
    source: { type: String, default: "popular" }, // which TMDB source
    movieId: { type: Schema.Types.ObjectId, ref: "Movie", default: null },
    movieSlug: { type: String, default: null },
    error: { type: String, default: null },
    processedAt: { type: Date, default: null },

    // ── AI verification ──────────────────────────────────────────────────
    aiVerified: { type: Boolean, default: false },
    aiConfidence: { type: Number, default: null },
    aiNotes: { type: String, default: null },
    aiCorrectedTitle: { type: String, default: null },
    aiCorrectedYear: { type: Number, default: null },
    aiIssues: { type: [String], default: [] },
  },
  { timestamps: true }
);

BotJobSchema.index({ status: 1, createdAt: -1 });

const BotJob =
  mongoose.models.BotJob || mongoose.model("BotJob", BotJobSchema);

export default BotJob;
