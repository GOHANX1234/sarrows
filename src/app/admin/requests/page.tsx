export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/db";
import Request from "@/models/Request";
import "@/models/User";
import AdminRequestsClient from "@/components/admin/AdminRequestsClient";

async function getRequests() {
  await connectDB();
  return Request.find().sort({ createdAt: -1 }).populate("user", "nickname email").lean();
}

export default async function AdminRequestsPage() {
  const requests = await getRequests();
  return <AdminRequestsClient requests={JSON.parse(JSON.stringify(requests))} />;
}
