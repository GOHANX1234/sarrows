import mongoose, { Schema } from "mongoose";

const WatchlistSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
    targetType: { type: String, enum: ["Movie", "Series"], required: true },
    targetId: { type: Schema.Types.ObjectId, refPath: "targetType", required: true },
  },
  { timestamps: true }
);

WatchlistSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

const Watchlist = mongoose.models.Watchlist || mongoose.model("Watchlist", WatchlistSchema);
export default Watchlist;
