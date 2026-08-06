/**
 * GET    /api/admin/app-versions/[id]  — fetch a single version
 * PATCH  /api/admin/app-versions/[id]  — update fields
 * DELETE /api/admin/app-versions/[id]  — delete version record
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AppVersion from "@/models/AppVersion";
import { auth } from "@/lib/auth";
import mongoose from "mongoose";

function isValidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function requireAdmin() {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") return null;
  return session;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    if (!isValidId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await connectDB();
    const version = await AppVersion.findById(id).lean();
    if (!version) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ version });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    if (!isValidId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();

    // Whitelist updatable fields — never let versionCode be changed (it's a unique key)
    const allowed = [
      "versionName", "platform", "channel", "downloadUrl", "releaseNotes",
      "forceUpdate", "minSupportedVersionCode", "rolloutPercentage", "isActive", "adminNotes",
    ];

    const update: any = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    if (Object.keys(update).length === 0)
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

    await connectDB();

    const existing = await AppVersion.findById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // If activating this version, deactivate other active versions on same platform+channel
    const targetPlatform = update.platform ?? existing.platform;
    const targetChannel  = update.channel  ?? existing.channel;

    if (update.isActive === true) {
      await AppVersion.updateMany(
        {
          _id: { $ne: id },
          platform: { $in: [targetPlatform, "all"] },
          channel: targetChannel,
          isActive: true,
        },
        { $set: { isActive: false } }
      );
    }

    const version = await AppVersion.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    return NextResponse.json({ version });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    if (!isValidId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await connectDB();
    const deleted = await AppVersion.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
