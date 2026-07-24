import Link from "next/link";
import LogoMark from "@/components/ui/LogoMark";
import { ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service — Sarrows",
  description: "Read the Sarrows Terms of Service to understand the rules and guidelines for using our platform.",
};

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: `By accessing or using Sarrows ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service. We reserve the right to update or modify these Terms at any time, and your continued use of the Service after any such changes constitutes your acceptance of the new Terms.`,
  },
  {
    title: "2. Eligibility",
    body: `You must be at least 13 years old to use Sarrows. By creating an account, you represent and warrant that you meet this age requirement and that all information you provide is accurate and complete. Accounts registered on behalf of minors under 13 will be removed without notice.`,
  },
  {
    title: "3. Account Registration",
    body: `To access certain features, you must register for an account using a valid email address and a username (nickname). You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorised use of your account. Sarrows is not liable for any loss resulting from unauthorised account access.`,
  },
  {
    title: "4. Permitted Use",
    body: `Sarrows grants you a limited, non-exclusive, non-transferable, revocable licence to access and use the Service for personal, non-commercial purposes. You agree not to: (a) reproduce, distribute, or publicly display any content without authorisation; (b) reverse-engineer or attempt to extract the source code of the Service; (c) use automated tools to scrape, crawl, or harvest content; (d) circumvent any access controls or content protection mechanisms; (e) upload, post, or transmit any unlawful, harmful, or offensive material.`,
  },
  {
    title: "5. Content & Intellectual Property",
    body: `All content available on Sarrows — including but not limited to video streams, images, metadata, logos, and text — is owned by or licensed to Sarrows and is protected by applicable intellectual property laws. You may not reproduce, republish, upload, post, transmit, or distribute such content without our express written consent. User-generated content (e.g., reviews and ratings) remains your property, but by submitting it you grant Sarrows a worldwide, royalty-free, perpetual licence to use, display, and distribute that content in connection with the Service.`,
  },
  {
    title: "6. Multi-Language Streams",
    body: `Sarrows provides streams with multiple audio tracks (dubbed) and subtitle options where available. The availability of specific language options depends on the content licence and source material. Sarrows does not guarantee that every title will have all languages available in all regions, and language availability may change without notice.`,
  },
  {
    title: "7. Third-Party Services",
    body: `The Service may contain links to or integrations with third-party websites and services. Sarrows is not responsible for the content, policies, or practices of any third-party service. Use of third-party services is subject to their respective terms and privacy policies.`,
  },
  {
    title: "8. Disclaimers & Limitation of Liability",
    body: `The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. Sarrows does not warrant that the Service will be uninterrupted, error-free, or free of harmful components. To the maximum extent permitted by applicable law, Sarrows shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service.`,
  },
  {
    title: "9. Termination",
    body: `Sarrows reserves the right to suspend or terminate your account and access to the Service at any time, with or without cause, and with or without notice. Upon termination, your right to use the Service will immediately cease. Provisions of these Terms that by their nature should survive termination will survive, including but not limited to intellectual property provisions and disclaimers.`,
  },
  {
    title: "10. Governing Law",
    body: `These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts of the applicable jurisdiction.`,
  },
  {
    title: "11. Contact",
    body: `If you have any questions about these Terms, please reach out to us on Telegram: @Gohan52. We aim to respond to all enquiries within 5 business days.`,
  },
];

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Last updated: July 2026 · Please read these terms carefully before using Sarrows.
          </p>
        </div>

        {/* Intro card */}
        <div
          className="rounded-2xl p-5 sm:p-6 mb-8 sm:mb-10"
          style={{ background: "rgba(229,9,20,0.07)", border: "1px solid rgba(229,9,20,0.18)" }}
        >
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
            These Terms of Service govern your access to and use of the Sarrows streaming platform. By creating an account
            or using any part of the Service, you agree to these Terms in full. If you are using the Service on behalf of
            an organisation, you represent that you have authority to bind that organisation to these Terms.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6 sm:space-y-8">
          {sections.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl p-5 sm:p-6"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <h2 className="text-base sm:text-lg font-bold text-white mb-3">{s.title}</h2>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed">{s.body}</p>
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
            <Link href="/terms" className="text-sarrows-red/80 hover:text-sarrows-red transition">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-400 transition">Privacy</Link>
            <Link href="/login" className="hover:text-gray-400 transition">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
