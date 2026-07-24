import mongoose, { Schema } from "mongoose";

const GenreSchema = new Schema(
  { name: { type: String, required: true, trim: true } },
  { timestamps: true }
);

// Case-insensitive uniqueness (collation strength 2) so "Drama" and "drama" collide at the DB
// level, closing the race window that an app-level pre-check alone can't cover.
GenreSchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

const Genre = mongoose.models.Genre || mongoose.model("Genre", GenreSchema);
export default Genre;
