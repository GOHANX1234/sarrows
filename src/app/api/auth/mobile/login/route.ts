import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { loginSchema } from "@/lib/validators/auth";
import { createMobileAccessToken, MOBILE_TOKEN_MAX_AGE_SECONDS } from "@/lib/mobile-auth";

export async function POST(req: NextRequest) {
  try {
    const parsed = loginSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select(
      "+passwordHash +loginAttempts +lockedUntil"
    );
    if (!user || (user.lockedUntil && user.lockedUntil > new Date())) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!valid) {
      const loginAttempts = (user.loginAttempts || 0) + 1;
      await User.findByIdAndUpdate(user._id, {
        loginAttempts,
        ...(loginAttempts >= 10
          ? { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) }
          : {}),
      });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await User.findByIdAndUpdate(user._id, { loginAttempts: 0, lockedUntil: null });
    const accessToken = await createMobileAccessToken({
      id: user._id.toString(),
      email: user.email,
      name: user.nickname,
      role: user.role,
    });

    return NextResponse.json({
      accessToken,
      tokenType: "Bearer",
      expiresIn: MOBILE_TOKEN_MAX_AGE_SECONDS,
      user: {
        id: user._id.toString(),
        nickname: user.nickname,
        email: user.email,
        image: user.image || null,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[MobileLogin]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}