export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/db";
import AppVersion from "@/models/AppVersion";
import AppUpdatesClient from "@/components/admin/AppUpdatesClient";

async function getVersions() {
  await connectDB();
  const versions = await AppVersion.find().sort({ versionCode: -1 }).lean();
  return JSON.parse(JSON.stringify(versions));
}

export default async function UpdatesPage() {
  const versions = await getVersions();
  return <AppUpdatesClient initialVersions={versions} />;
}
