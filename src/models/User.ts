import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema(
  {
    nickname: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 20 },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    image: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    emailVerified: Date,
    loginAttempts: { type: Number, default: 0 },
    lockedUntil: Date,
  },
  { timestamps: true }
);

UserSchema.index({ role: 1 });

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
