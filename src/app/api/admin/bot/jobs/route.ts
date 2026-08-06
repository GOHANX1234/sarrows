import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import BotJob from "@/models/BotJob";

function adminOnly() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/** GET /api/admin/bot/jobs — paginated upload history */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") return adminOnly();

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");
    const q = searchParams.get("q");

    const filter: any = {};
    if (status && status !== "all") filter.status = status;
    if (q?.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = { $regex: escaped, $options: "i" };
    }

    await connectDB();
    const [jobs, total, counts] = await Promise.all([
      BotJob.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      BotJob.countDocuments(filter),
      BotJob.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    const statusCounts = counts.reduce((acc: any, row: any) => {
      acc[row._id] = row.count;
      return acc;
    }, {});

    return NextResponse.json({ jobs, total, page, totalPages: Math.ceil(total / limit), statusCounts });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** DELETE /api/admin/bot/jobs — clear history by status */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") return adminOnly();

    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");

    await connectDB();

    if (status && ["done", "failed", "duplicate"].includes(status)) {
      const result = await BotJob.deleteMany({ status });
      return NextResponse.json({ deleted: result.deletedCount });
    }

    // Clear all history
    const result = await BotJob.deleteMany({});
    return NextResponse.json({ deleted: result.deletedCount });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
