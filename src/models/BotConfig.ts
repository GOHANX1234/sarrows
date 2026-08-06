import mongoose, { Schema } from "mongoose";

/**
 * Singleton document — always upsert by the fixed `_id: "singleton"`.
 * Sources ordered smartest-first: freshest content least likely to already be in DB.
 */
const BotConfigSchema = new Schema(
  {
    _id: { type: String, default: "singleton" },
    enabled: { type: Boolean, default: false },

    // ── Stats ──────────────────────────────────────────────────────────────
    uploadedCount:     { type: Number, default: 0 },
    duplicateCount:    { type: Number, default: 0 },
    failedCount:       { type: Number, default: 0 },
    lastActivity:      { type: Date,   default: null },
    lastError:         { type: String, default: null },
    lastUploadedTitle: { type: String, default: null },
    startedAt:         { type: Date,   default: null },
    stoppedAt:         { type: Date,   default: null },

    // ── Discovery settings ─────────────────────────────────────────────────
    // Order matters: upcoming/now_playing have freshest content; popular is last
    sources: {
      type: [String],
      default: ["upcoming", "now_playing", "trending_day", "trending_week", "top_rated", "popular"],
    },

    // ── Discovery cursor ───────────────────────────────────────────────────
    currentSourceIdx: { type: Number, default: 0 },
    currentPage:      { type: Number, default: 1 },
    currentMovieIdx:  { type: Number, default: 0 },
  },
  { _id: false, timestamps: true }
);

const BotConfig =
  mongoose.models.BotConfig || mongoose.model("BotConfig", BotConfigSchema);

export default BotConfig;
