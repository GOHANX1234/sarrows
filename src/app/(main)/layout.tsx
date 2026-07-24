"use client";

import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen flex flex-col bg-sarrows-dark">
        <Navbar />
        {/* pt-16 for top nav, pb-20 for bottom nav (now shown on all screen sizes) */}
        {/* pt for top bar, pb for bottom nav (always visible) */}
        <main className="flex-1 pt-14 sm:pt-16 pb-[4.5rem]">{children}</main>
        <Footer />
      </div>
    </SessionProvider>
  );
}
