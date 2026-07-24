import mongoose, { Schema } from "mongoose";

const EpisodeSchema = new Schema(
  {
    series: { type: Schema.Types.ObjectId, ref: "Series", index: true, required: true },
    season: { type: Number, default: 1 },
    episodeNumber: { type: Number, required: true },
    title: String,
    videoUrl: { type: String, select: false },
    videoType: { type: String, enum: ["auto", "hls", "direct", "embed"], default: "auto", select: false },
  },
  { timestamps: true }
);

EpisodeSchema.index({ series: 1, season: 1, episodeNumber: 1 }, { unique: true });

const Episode = mongoose.models.Episode || mongoose.model("Episode", EpisodeSchema);
export default Episode;
