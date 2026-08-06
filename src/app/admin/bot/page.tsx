import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import BotConfig from "@/models/BotConfig";
import BotJob from "@/models/BotJob";
import { serialize } from "@/lib/utils";
import BotClient from "@/components/admin/BotClient";

export const dynamic = "force-dynamic";

export default async function BotPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/login");

  await connectDB();

  const [cfgRaw, countRaw] = await Promise.all([
    BotConfig.findById("singleton").lean(),
    BotJob.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const cfg: any = cfgRaw
    ? serialize(cfgRaw)
    : {
        enabled: false,
        uploadedCount: 0,
        duplicateCount: 0,
        failedCount: 0,
        lastActivity: null,
        lastError: null,
        lastUploadedTitle: null,
        startedAt: null,
        stoppedAt: null,
      };

  const statusCounts = (countRaw as any[]).reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {} as Record<string, number>);

  return <BotClient initialConfig={cfg} initialStatusCounts={statusCounts} />;
}
