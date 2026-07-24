import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import ViewLog from "@/models/ViewLog";
import Movie from "@/models/Movie";
import Series from "@/models/Series";
import Episode from "@/models/Episode";
import mongoose from "mongoose";

const VALID_TYPES = ["Movie", "Series", "Episode"] as const;
type TargetType = (typeof VALID_TYPES)[number];

function isValidObjectId(id: string) {
  return /^[a-f\d]{24}$/i.test(id);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const { targetType, targetId } = body;

    if (!VALID_TYPES.includes(targetType)) {
      return NextResponse.json({ ok: false, error: "Invalid targetType" }, { status: 400 });
    }
    if (!targetId || !isValidObjectId(String(targetId))) {
      return NextResponse.json({ ok: false, error: "Invalid targetId" }, { status: 400 });
    }

    await connectDB();
    const targetOid = new mongoose.Types.ObjectId(targetId as string);

    // Verify the target exists
    const modelMap: Record<TargetType, mongoose.Model<any>> = {
      Movie,
      Series,
      Episode,
    };
    const exists = await modelMap[targetType as TargetType].exists({ _id: targetOid });
    if (!exists) return NextResponse.json({ ok: false, error: "Content not found" }, { status: 404 });

    try {
      await ViewLog.create({
        user: new mongoose.Types.ObjectId(session.user.id),
        targetType,
        targetId: targetOid,
      });

      // First view — increment counter
      if (targetType === "Movie") {
        await Movie.findByIdAndUpdate(targetId, { $inc: { views: 1 } });
      } else if (targetType === "Series") {
        await Series.findByIdAndUpdate(targetId, { $inc: { views: 1 } });
      } else if (targetType === "Episode") {
        const ep = await Episode.findByIdAndUpdate(targetId, { $inc: { views: 1 } }, { new: true });
        if (ep?.series) {
          await Series.findByIdAndUpdate(ep.series, { $inc: { views: 1 } });
        }
      }

      return NextResponse.json({ ok: true, counted: true });
    } catch (err: any) {
      if (err.code === 11000) return NextResponse.json({ ok: true, counted: false });
      throw err;
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
