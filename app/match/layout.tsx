import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Course Matcher",
  description: "See exactly which courses and sections you share with your friends across UTSG, UTM, and UTSC. Create a room and share a 6-character code.",
  alternates: { canonical: "https://varsio.vercel.app/match" },
  openGraph: { url: "https://varsio.vercel.app/match", title: "Course Matcher | Varsio" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
