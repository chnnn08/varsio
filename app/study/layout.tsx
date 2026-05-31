import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Study Sessions",
  description: "Paste your UofT lecture notes and let AI generate a custom quiz. Host public or private study sessions and invite your classmates.",
  keywords: ["UofT study group", "AI quiz generator", "UofT study sessions", "lecture notes quiz", "UTSG study", "university quiz app"],
  alternates: { canonical: "https://varsio.vercel.app/study" },
  openGraph: {
    url: "https://varsio.vercel.app/study",
    title: "AI Study Sessions | Varsio",
    description: "Paste your UofT lecture notes and let AI generate a custom quiz. Host public or private study sessions with your classmates.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Study Sessions | Varsio",
    description: "Paste your UofT lecture notes and let AI generate a custom quiz. Invite your classmates to study together.",
    images: ["/opengraph-image"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
