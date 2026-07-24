import mongoose, { Schema } from "mongoose";

const ViewLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["Movie", "Series", "Episode"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

// Unique: one view per user per content item
ViewLogSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

const ViewLog = mongoose.models.ViewLog || mongoose.model("ViewLog", ViewLogSchema);
export default ViewLog;
