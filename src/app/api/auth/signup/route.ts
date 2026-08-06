import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { signupSchema } from "@/lib/validators/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((e) => {
        const field = e.path[0] as string;
        fieldErrors[field] = e.message;
      });
      return NextResponse.json({ error: "Validation failed", fieldErrors }, { status: 400 });
    }

    const { nickname, email, password } = parsed.data;
    await connectDB();

    // Check uniqueness
    const existing = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { nickname: { $regex: new RegExp(`^${nickname}$`, "i") } },
      ],
    });
    if (existing) {
      if (existing.email === email.toLowerCase()) {
        return NextResponse.json({ error: "Email taken", fieldErrors: { email: "This email is already registered" } }, { status: 409 });
      }
      return NextResponse.json({ error: "Nickname taken", fieldErrors: { nickname: "This nickname is already taken" } }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ nickname, email: email.toLowerCase(), passwordHash });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[Signup]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
