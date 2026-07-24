import Link from "next/link";
import { Heart } from "lucide-react";
import LogoMark from "@/components/ui/LogoMark";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.05] mt-20 pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <Link href="/home" className="inline-flex items-center gap-2 mb-3">
              <LogoMark size={28} />
              <span className="text-lg font-black text-white">SARROWS</span>
            </Link>
            <p className="text-gray-600 text-sm max-w-xs leading-relaxed">
              Your premium destination for movies and anime streaming.
            </p>
          </div>

          <div className="flex gap-16">
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Browse</h4>
              <ul className="space-y-2.5 text-sm text-gray-600">
                {[["Movies", "/movies"], ["Anime", "/anime"], ["Search", "/search"]].map(([l, h]) => (
                  <li key={h}><Link href={h} className="hover:text-gray-300 transition">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Account</h4>
              <ul className="space-y-2.5 text-sm text-gray-600">
                {[["Sign In", "/login"], ["Sign Up", "/signup"], ["Watchlist", "/watchlist"]].map(([l, h]) => (
                  <li key={h}><Link href={h} className="hover:text-gray-300 transition">{l}</Link></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.05] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-700">
          <span>© {new Date().getFullYear()} Sarrows. All rights reserved.</span>
          <span className="flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-sarrows-red fill-current" /> for streaming lovers
          </span>
        </div>
      </div>
    </footer>
  );
}
