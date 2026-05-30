import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Buy textbooks from students who just finished the course. Find peer tutors in your program. UofT student marketplace.",
  alternates: { canonical: "https://varsio.vercel.app/marketplace" },
  openGraph: { url: "https://varsio.vercel.app/marketplace", title: "Marketplace | Varsio" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
