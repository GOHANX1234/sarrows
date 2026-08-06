import mongoose, { Schema } from "mongoose";

const AppVersionSchema = new Schema(
  {
    // Semantic version string shown to users, e.g. "1.2.3"
    versionName: { type: String, required: true, trim: true },
    // Integer build code — must always increment. Native app sends this for comparison.
    versionCode: { type: Number, required: true, unique: true },
    // Target platform
    platform: {
      type: String,
      enum: ["android", "ios", "all"],
      default: "android",
      required: true,
    },
    // Release channel — stable goes to all users, beta only to opted-in users
    channel: {
      type: String,
      enum: ["stable", "beta"],
      default: "stable",
    },
    // Direct download link (APK / IPA) or Play Store / App Store URL
    downloadUrl: { type: String, required: true, trim: true },
    // Human-readable changelog (supports markdown)
    releaseNotes: { type: String, default: "" },
    // If true, the native app must update before it can be used
    forceUpdate: { type: Boolean, default: false },
    // Any app with versionCode below this value is considered unsupported.
    // The native app will be force-upgraded even if forceUpdate is false.
    minSupportedVersionCode: { type: Number, default: 1 },
    // Gradual rollout — percentage of users who should see this update (0–100).
    // 100 = full rollout. The native app uses its own logic to decide based on
    // the percentage value returned by the API.
    rolloutPercentage: { type: Number, default: 100, min: 0, max: 100 },
    // Whether this version is the active "latest" record returned by the check API.
    // Only one version per platform+channel combination should be active at a time.
    isActive: { type: Boolean, default: true },
    // Optional internal notes visible only in admin (not sent to native app)
    adminNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

AppVersionSchema.index({ platform: 1, channel: 1, isActive: 1 });
AppVersionSchema.index({ versionCode: -1 });

const AppVersion =
  mongoose.models.AppVersion ||
  mongoose.model("AppVersion", AppVersionSchema);

export default AppVersion;
