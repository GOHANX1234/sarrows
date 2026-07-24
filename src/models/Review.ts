import mongoose, { Schema } from "mongoose";

const ReviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["Movie", "Series"], required: true },
    targetId: { type: Schema.Types.ObjectId, refPath: "targetType", required: true },
    rating: { type: Number, min: 1, max: 10, required: true },
    comment: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

ReviewSchema.index({ targetType: 1, targetId: 1 });
ReviewSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

const Review = mongoose.models.Review || mongoose.model("Review", ReviewSchema);
export default Review;
