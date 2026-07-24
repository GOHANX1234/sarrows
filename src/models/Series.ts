import mongoose, { Schema } from "mongoose";

const SeriesSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true, index: true },
    description: String,
    posterUrl: String,
    bannerUrl: String,
    genres: [{ type: Schema.Types.ObjectId, ref: "Genre" }],
    cast: [
      {
        name: { type: String, required: true },
        character: String,
        image: String,
        order: Number,
      },
    ],
    totalSeasons: Number,
    releaseYear: { type: Number, index: true },
    status: { type: String, enum: ["ongoing", "completed"], default: "ongoing" },
    type: { type: String, enum: ["anime", "series"], default: "anime" },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    publishStatus: { type: String, enum: ["published", "draft"], default: "draft" },
  },
  { timestamps: true }
);

SeriesSchema.index({ title: "text", description: "text" });
SeriesSchema.index({ genres: 1, type: 1 });
SeriesSchema.index({ publishStatus: 1, type: 1 });
SeriesSchema.index({ views: -1 });

const Series = mongoose.models.Series || mongoose.model("Series", SeriesSchema);
export default Series;
