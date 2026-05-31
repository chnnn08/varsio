import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Course Chat",
  description: "Ask questions and find study partners in course-specific threads. Direct message any UofT student. Built for UTSG, UTM, and UTSC.",
  keywords: ["UofT course chat", "UofT study partners", "UTSG forums", "university student chat", "UofT classmates", "course discussion"],
  alternates: { canonical: "https://varsio.vercel.app/chat" },
  openGraph: {
    url: "https://varsio.vercel.app/chat",
    title: "Course Chat | Varsio",
    description: "Ask questions and find study partners in course-specific threads. Direct message any UofT student.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Course Chat | Varsio",
    description: "Ask questions and find study partners in course-specific threads. Built for UofT students.",
    images: ["/opengraph-image"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
