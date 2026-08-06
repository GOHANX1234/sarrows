/**
 * GET  /api/admin/app-versions  — list all versions (paginated)
 * POST /api/admin/app-versions  — create a new version record
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AppVersion from "@/models/AppVersion";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") return null;
  return session;
}

export async function GET(req: NextRequest) {
  try {
    if (!(await requireAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const platform = searchParams.get("platform"); // android | ios | all | null
    const channel = searchParams.get("channel");   // stable | beta | null

    const filter: any = {};
    if (platform && ["android", "ios", "all"].includes(platform))
      filter.platform = platform;
    if (channel && ["stable", "beta"].includes(channel))
      filter.channel = channel;

    await connectDB();

    const [versions, total] = await Promise.all([
      AppVersion.find(filter)
        .sort({ versionCode: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AppVersion.countDocuments(filter),
    ]);

    return NextResponse.json({ versions, total, page, totalPages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();

    // Basic validation
    const { versionName, versionCode, platform, channel, downloadUrl, releaseNotes,
            forceUpdate, minSupportedVersionCode, rolloutPercentage, isActive, adminNotes } = body;

    if (!versionName || typeof versionName !== "string" || !versionName.trim())
      return NextResponse.json({ error: "versionName is required" }, { status: 400 });

    if (!Number.isInteger(versionCode) || versionCode < 1)
      return NextResponse.json({ error: "versionCode must be a positive integer" }, { status: 400 });

    if (!["android", "ios", "all"].includes(platform))
      return NextResponse.json({ error: "platform must be android, ios, or all" }, { status: 400 });

    if (!["stable", "beta"].includes(channel))
      return NextResponse.json({ error: "channel must be stable or beta" }, { status: 400 });

    if (!downloadUrl || typeof downloadUrl !== "string" || !downloadUrl.trim())
      return NextResponse.json({ error: "downloadUrl is required" }, { status: 400 });

    await connectDB();

    // If this new version is active, deactivate other active versions on the same channel.
    // "all" platform covers every device, so activating an "all" version deactivates
    // everything on that channel. A platform-specific version deactivates both its
    // own platform and any "all" records (since they'd otherwise override each other).
    if (isActive !== false) {
      const platformFilter =
        platform === "all"
          ? {} // "all" → deactivate every platform on this channel
          : { platform: { $in: [platform, "all"] } }; // specific → deactivate same + "all"
      await AppVersion.updateMany(
        { ...platformFilter, channel, isActive: true },
        { $set: { isActive: false } }
      );
    }

    const version = await AppVersion.create({
      versionName: versionName.trim(),
      versionCode,
      platform,
      channel,
      downloadUrl: downloadUrl.trim(),
      releaseNotes: releaseNotes ?? "",
      forceUpdate: forceUpdate === true,
      minSupportedVersionCode: Number.isInteger(minSupportedVersionCode) ? minSupportedVersionCode : 1,
      rolloutPercentage: typeof rolloutPercentage === "number" ? Math.min(100, Math.max(0, rolloutPercentage)) : 100,
      isActive: isActive !== false,
      adminNotes: adminNotes ?? "",
    });

    return NextResponse.json({ version }, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000)
      return NextResponse.json({ error: "A version with this versionCode already exists" }, { status: 409 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
