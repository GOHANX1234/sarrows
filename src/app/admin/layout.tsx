import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = { title: "Admin Panel — Sarrows" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") redirect("/");
  return (
    <div className="min-h-screen bg-sarrows-darker">
      <AdminSidebar />
      {/*
        Mobile: pt-14 (top bar) + pb-[4.5rem] (bottom nav)
        Desktop: ml-56, no top/bottom offset
      */}
      <main className="md:ml-56 pt-14 md:pt-0 pb-[4.5rem] md:pb-0 p-4 md:p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
