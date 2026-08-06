/**
 * POST /api/app/version/check
 *
 * Public endpoint — no auth required.
 * Native app calls this on startup to discover whether an update is available.
 *
 * Request body:
 *   { versionCode: number, platform: "android" | "ios", channel?: "stable" | "beta" }
 *
 * Response:
 *   {
 *     updateAvailable: boolean,
 *     forceUpdate: boolean,           // must update before continuing
 *     currentVersionSupported: boolean,
 *     latestVersionCode: number | null,
 *     latestVersionName: string | null,
 *     downloadUrl: string | null,
 *     releaseNotes: string | null,
 *     channel: "stable" | "beta" | null,
 *     rolloutPercentage: number | null,
 *     minSupportedVersionCode: number | null
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AppVersion from "@/models/AppVersion";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { versionCode, platform, channel } = body;

    if (typeof versionCode !== "number" || !Number.isInteger(versionCode)) {
      return NextResponse.json(
        { error: "versionCode must be an integer" },
        { status: 400 }
      );
    }

    const validPlatforms = ["android", "ios"];
    if (!platform || !validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: "platform must be 'android' or 'ios'" },
        { status: 400 }
      );
    }

    const resolvedChannel = channel === "beta" ? "beta" : "stable";

    await connectDB();

    // Find the latest active version for this platform+channel.
    // "all" platform entries match every native platform.
    const latest = await AppVersion.findOne({
      isActive: true,
      channel: resolvedChannel,
      platform: { $in: [platform, "all"] },
    })
      .sort({ versionCode: -1 })
      .lean() as any;

    if (!latest) {
      // No version record configured yet — tell the app it's fine
      return NextResponse.json({
        updateAvailable: false,
        forceUpdate: false,
        currentVersionSupported: true,
        latestVersionCode: null,
        latestVersionName: null,
        downloadUrl: null,
        releaseNotes: null,
        channel: resolvedChannel,
        rolloutPercentage: null,
        minSupportedVersionCode: null,
      });
    }

    const updateAvailable = latest.versionCode > versionCode;

    // Force update if:
    //   (a) The version record explicitly marks this release as forced, OR
    //   (b) The client version is below the minimum supported version code
    const belowMinSupport = versionCode < (latest.minSupportedVersionCode ?? 1);
    const forceUpdate = (updateAvailable && latest.forceUpdate) || belowMinSupport;
    const currentVersionSupported = !belowMinSupport;

    return NextResponse.json({
      updateAvailable,
      forceUpdate,
      currentVersionSupported,
      latestVersionCode: latest.versionCode,
      latestVersionName: latest.versionName,
      downloadUrl: updateAvailable ? latest.downloadUrl : null,
      releaseNotes: updateAvailable ? latest.releaseNotes : null,
      channel: latest.channel,
      rolloutPercentage: latest.rolloutPercentage,
      minSupportedVersionCode: latest.minSupportedVersionCode,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Also support GET for simple health-check / discovery
export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/app/version/check",
    body: { versionCode: "integer", platform: "android | ios", channel: "stable | beta (optional)" },
  });
}
