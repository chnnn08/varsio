import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore UofT",
  description: "Course connections, section swap board, open study spaces, and professor ratings across UTSG, UTM, and UTSC.",
  alternates: { canonical: "https://varsio.vercel.app/explore" },
  openGraph: { url: "https://varsio.vercel.app/explore", title: "Explore UofT | Varsio" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
