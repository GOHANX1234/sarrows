import mongoose, { Schema } from "mongoose";

const RequestSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    type: { type: String, enum: ["movie", "series", "anime"], required: true },
    note: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: ["pending", "in_progress", "fulfilled", "rejected"], default: "pending", index: true },
    adminNote: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

const Request = mongoose.models.Request || mongoose.model("Request", RequestSchema);
export default Request;
