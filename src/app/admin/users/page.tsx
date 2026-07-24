export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import AdminUsersClient from "@/components/admin/AdminUsersClient";

async function getUsers() {
  await connectDB();
  return User.find().sort({ createdAt: -1 }).lean();
}

export default async function AdminUsersPage() {
  const users = await getUsers();
  return <AdminUsersClient users={JSON.parse(JSON.stringify(users))} />;
}
