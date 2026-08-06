import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import DeviceToken from "@/models/DeviceToken";
import { getMobileUser } from "@/lib/mobile-auth";
import { z } from "zod";

const deviceTokenSchema = z.object({
  token: z.string().trim().min(1).max(4096),
  platform: z.literal("android").default("android"),
  deviceId: z.string().trim().max(200).optional(),
  appVersion: z.string().trim().max(50).optional(),
});

async function authenticate(req: NextRequest) {
  const user = await getMobileUser(req);
  if (!user || !mongoose.isValidObjectId(user.id)) return null;
  return user;
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = deviceTokenSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    await connectDB();
    if (parsed.data.deviceId) {
      await DeviceToken.deleteMany({
        user: user.id,
        platform: parsed.data.platform,
        deviceId: parsed.data.deviceId,
        token: { $ne: parsed.data.token },
      });
    }

    await DeviceToken.findOneAndUpdate(
      { token: parsed.data.token },
      {
        $set: {
          user: user.id,
          platform: parsed.data.platform,
          deviceId: parsed.data.deviceId,
          appVersion: parsed.data.appVersion,
          lastSeenAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as any)?.code === 11000) {
      return NextResponse.json({ error: "Device token is already registered" }, { status: 409 });
    }
    console.error("[DeviceToken:register]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const parsed = z.object({ token: z.string().trim().min(1).max(4096) }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "A valid FCM token is required" }, { status: 400 });
    }

    await connectDB();
    await DeviceToken.deleteOne({ token: parsed.data.token, user: user.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DeviceToken:remove]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}