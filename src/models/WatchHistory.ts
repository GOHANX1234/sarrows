import mongoose, { Schema } from "mongoose";

const WatchHistorySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
    targetType: { type: String, enum: ["Movie", "Episode"], required: true },
    targetId: { type: Schema.Types.ObjectId, refPath: "targetType", required: true },
    progressSeconds: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

WatchHistorySchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

const WatchHistory = mongoose.models.WatchHistory || mongoose.model("WatchHistory", WatchHistorySchema);
export default WatchHistory;
