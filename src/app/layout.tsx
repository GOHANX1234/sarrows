import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#E50914",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://sarrows.vercel.app"),
  title: { default: "Sarrows — Stream Movies & Anime", template: "%s | Sarrows" },
  description: "Watch the latest movies and anime on Sarrows — your premium streaming destination.",
  keywords: ["streaming", "movies", "anime", "watch online", "sarrows"],
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/logo.svg",
    shortcut: "/logo.svg",
  },
  openGraph: {
    type: "website",
    siteName: "Sarrows",
    title: "Sarrows — Stream Movies & Anime",
    description: "Watch the latest movies and anime on Sarrows — your premium streaming destination.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Sarrows" }],
  },
  twitter: {
    card: "summary",
    title: "Sarrows — Stream Movies & Anime",
    description: "Watch the latest movies and anime on Sarrows.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-sarrows-dark">
        {children}
      </body>
    </html>
  );
}
