import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Marketplace",
  description: "Buy UofT textbooks directly from students who just finished the course. Find and offer peer tutoring by course code. No fees, no middleman.",
  keywords: ["UofT textbooks", "buy sell textbooks UofT", "UofT tutoring", "peer tutors University of Toronto", "used textbooks UTSG", "UofT marketplace"],
  alternates: { canonical: "https://varsio.vercel.app/marketplace" },
  openGraph: {
    url: "https://varsio.vercel.app/marketplace",
    title: "Student Marketplace | Varsio",
    description: "Buy UofT textbooks from students who just finished the course. Find peer tutors by course code.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Student Marketplace | Varsio",
    description: "Buy UofT textbooks directly from students. Find peer tutors by course code. No fees.",
    images: ["/opengraph-image"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
