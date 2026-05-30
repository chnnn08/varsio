import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: {
    default: "Varsio â€” Student Platform for University of Toronto",
    template: "%s | Varsio",
  },
  description:
    "Varsio is the student super-app for UofT. Match courses with friends, run AI study sessions, chat by course, and access tools built for UTSG, UTM, and UTSC.",
  keywords: [
    "UofT", "University of Toronto", "student app", "course matcher",
    "study sessions", "UTSG", "UTM", "UTSC", "UofT students", "Varsio",
  ],
  authors: [{ name: "Varsio" }],
  creator: "Varsio",
  metadataBase: new URL("https://varsio.vercel.app"),
  openGraph: {
    type: "website",
    url: "https://varsio.vercel.app",
    siteName: "Varsio",
    title: "Varsio â€” Student Platform for University of Toronto",
    description:
      "Match courses with friends, run AI study sessions, and access tools built for UofT students across all three campuses.",
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Varsio â€” Student Platform for University of Toronto",
    description:
      "Match courses with friends, run AI study sessions, and access tools built for UofT students across all three campuses.",
    creator: "@varsio",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://varsio.vercel.app",
  },
  verification: {
    google: "iR84YbhiR-KJYriX-IwYTvAT85Ap_sZ_YGafoOSmeGo",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white text-[#0F172A]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 bg-white py-8 mt-20">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="28" height="28" rx="7" fill="#F0B429"/>
                <path d="M8 10.5 Q8 7 11.5 7 H16.5 Q20 7 20 10.5 Q20 14 14 14" stroke="#002A5C" strokeWidth="2.6" fill="none" strokeLinecap="round"/>
                <path d="M20 17.5 Q20 21 16.5 21 H11.5 Q8 21 8 17.5 Q8 14 14 14" stroke="#002A5C" strokeWidth="2.6" fill="none" strokeLinecap="round"/>
              </svg>
              <span className="text-sm font-semibold text-[#002A5C]">Varsio</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="/match" className="hover:text-gray-600 transition-colors">Match</a>
              <a href="/study" className="hover:text-gray-600 transition-colors">Study</a>
              <a href="/chat" className="hover:text-gray-600 transition-colors">Chat</a>
              <a href="/tools" className="hover:text-gray-600 transition-colors">Tools</a>
              <a href="/marketplace" className="hover:text-gray-600 transition-colors">Marketplace</a>
            </div>
            <p className="text-sm text-gray-400">Built by students, for students &middot; University of Toronto</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
