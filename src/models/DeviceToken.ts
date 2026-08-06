import mongoose, { Schema } from "mongoose";

const DeviceTokenSchema = new Schema(
  {
    token: { type: String, required: true, unique: true, index: true, trim: true, maxlength: 4096 },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    platform: { type: String, enum: ["android"], default: "android", required: true },
    deviceId: { type: String, trim: true, maxlength: 200 },
    appVersion: { type: String, trim: true, maxlength: 50 },
    lastSeenAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

DeviceTokenSchema.index({ user: 1, deviceId: 1 });

const DeviceToken =
  mongoose.models.DeviceToken || mongoose.model("DeviceToken", DeviceTokenSchema);

export default DeviceToken;