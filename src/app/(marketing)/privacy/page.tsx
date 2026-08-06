import Link from "next/link";
import LogoMark from "@/components/ui/LogoMark";
import { ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Sarrows",
  description: "Learn how Sarrows collects, uses, and protects your personal information.",
};

const sections = [
  {
    title: "1. Information We Collect",
    items: [
      {
        sub: "Account Information",
        body: "When you register, we collect your email address, chosen username (nickname), and a hashed version of your password. We never store your password in plain text.",
      },
      {
        sub: "Usage Data",
        body: "We collect information about how you interact with the Service, including titles you watch, search queries, watchlist additions, ratings and reviews you submit, watch history, and the device and browser you use.",
      },
      {
        sub: "Technical Data",
        body: "We automatically receive standard server log information such as IP addresses, browser type, referring URLs, and timestamps. This data is used for security monitoring and performance optimisation.",
      },
    ],
  },
  {
    title: "2. How We Use Your Information",
    items: [
      {
        sub: "Service Delivery",
        body: "To authenticate your account, deliver the streaming service, remember your watch history and preferences, and provide personalised content recommendations.",
      },
      {
        sub: "Communication",
        body: "To send you service-related notifications such as password reset emails. We will not send you marketing emails without your explicit consent.",
      },
      {
        sub: "Safety & Integrity",
        body: "To detect and prevent fraud, abuse, and violations of our Terms of Service, and to enforce our policies.",
      },
      {
        sub: "Analytics & Improvement",
        body: "To understand how users interact with the platform so we can improve performance, fix bugs, and develop new features. Analytics data is aggregated and de-identified where possible.",
      },
    ],
  },
  {
    title: "3. Multi-Language & Stream Data",
    items: [
      {
        sub: "Language Preferences",
        body: "We may store your selected audio language and subtitle preferences per title or globally, to restore your preferred settings when you return to a stream.",
      },
      {
        sub: "Playback Telemetry",
        body: "We collect anonymous playback telemetry (buffering events, quality changes, stream errors) to improve stream reliability. This data is not linked to your identity beyond an anonymous session identifier.",
      },
    ],
  },
  {
    title: "4. Data Sharing",
    items: [
      {
        sub: "We Do Not Sell Your Data",
        body: "Sarrows does not sell, rent, or trade your personal information to third parties for their marketing purposes.",
      },
      {
        sub: "Service Providers",
        body: "We may share limited data with trusted service providers who help us operate the platform (e.g., cloud infrastructure, email delivery). These providers are contractually bound to keep your data confidential and use it only to perform services on our behalf.",
      },
      {
        sub: "Legal Requirements",
        body: "We may disclose your information if required to do so by law, court order, or governmental authority, or if we believe in good faith that such disclosure is necessary to protect our rights, your safety, or the safety of others.",
      },
    ],
  },
  {
    title: "5. Cookies & Local Storage",
    items: [
      {
        sub: "Session Cookies",
        body: "We use session cookies and JWT tokens to keep you logged in across page loads. These are essential for the Service to function and cannot be disabled.",
      },
      {
        sub: "Preference Storage",
        body: "We may use browser localStorage to remember UI preferences such as volume level, selected language, and theme. No personal information is stored in localStorage.",
      },
    ],
  },
  {
    title: "6. Data Retention",
    items: [
      {
        sub: "Account Data",
        body: "We retain your account data for as long as your account is active. If you request deletion of your account, we will remove your personal data within 30 days, except where retention is required by law.",
      },
      {
        sub: "Logs",
        body: "Server and security logs are retained for up to 90 days and are then permanently deleted.",
      },
    ],
  },
  {
    title: "7. Your Rights",
    items: [
      {
        sub: "Access & Portability",
        body: "You may request a copy of the personal data we hold about you at any time by reaching out to us on Telegram: @Gohan52.",
      },
      {
        sub: "Correction",
        body: "You may update your account information at any time from your profile settings.",
      },
      {
        sub: "Deletion",
        body: "You may request the deletion of your account and associated personal data by contacting us. We will action deletion requests within 30 days.",
      },
      {
        sub: "Objection",
        body: "Where we process your data on the basis of legitimate interests, you have the right to object. Please contact us and we will review your request.",
      },
    ],
  },
  {
    title: "8. Security",
    items: [
      {
        sub: "Technical Safeguards",
        body: "We implement industry-standard security measures including HTTPS encryption in transit, bcrypt password hashing, and access controls for our database and infrastructure.",
      },
      {
        sub: "No Guarantee",
        body: "While we take the security of your data seriously, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security and encourage you to use a strong, unique password for your account.",
      },
    ],
  },
  {
    title: "9. Children's Privacy",
    items: [
      {
        sub: "Age Restriction",
        body: "The Service is not directed to children under 13. We do not knowingly collect personal information from anyone under 13. If we become aware that we have collected data from a child under 13, we will delete it promptly.",
      },
    ],
  },
  {
    title: "10. Changes to This Policy",
    items: [
      {
        sub: "Notification",
        body: "We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page with an updated effective date. Your continued use of the Service after changes are posted constitutes your acceptance of the updated policy.",
      },
    ],
  },
  {
    title: "11. Contact Us",
    items: [
      {
        sub: "Privacy Enquiries",
        body: "If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please reach out to us on Telegram: @Gohan52. We aim to respond within 5 business days.",
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-sarrows-darker">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-navbar">
        <div
          className="absolute bottom-0 inset-x-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(229,9,20,0.35), transparent)" }}
        />
        <div className="flex items-center justify-between max-w-4xl mx-auto px-4 sm:px-6 h-14 sm:h-16">
          <Link href="/" className="flex items-center gap-2 flex-none">
            <LogoMark size={26} />
            <span className="text-sm font-black text-white tracking-tight">SARROWS</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-white/[0.06]"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-20">
        {/* Header */}
        <div className="mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-sarrows-red mb-4">
            <span className="w-4 h-px bg-sarrows-red" /> Legal
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
            Privacy Policy
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Last updated: July 2026 · Your privacy matters to us — here is exactly what we collect and why.
          </p>
        </div>

        {/* Intro card */}
        <div
          className="rounded-2xl p-5 sm:p-6 mb-8 sm:mb-10"
          style={{ background: "rgba(229,9,20,0.07)", border: "1px solid rgba(229,9,20,0.18)" }}
        >
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
            Sarrows is committed to protecting your personal information and being transparent about what data we collect
            and how we use it. This Privacy Policy explains our practices in plain language. We do not sell your data —
            ever.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6 sm:space-y-8">
          {sections.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div
                className="px-5 sm:px-6 py-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <h2 className="text-base sm:text-lg font-bold text-white">{s.title}</h2>
              </div>
              <div className="divide-y divide-white/[0.05]">
                {s.items.map((item) => (
                  <div key={item.sub} className="px-5 sm:px-6 py-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">{item.sub}</p>
                    <p className="text-gray-400 text-sm sm:text-base leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t border-white/[0.06] py-8 px-4 sm:px-6 text-center"
        style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-4xl mx-auto gap-4">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={22} />
            <span className="text-sm font-black text-white">SARROWS</span>
          </Link>
          <p className="text-gray-600 text-xs">© {new Date().getFullYear()} Sarrows. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <Link href="/terms" className="hover:text-gray-400 transition">Terms</Link>
            <Link href="/privacy" className="text-sarrows-red/80 hover:text-sarrows-red transition">Privacy</Link>
            <Link href="/login" className="hover:text-gray-400 transition">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
