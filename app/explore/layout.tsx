import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore UofT",
  description: "Discover UofT students by program and year, find open study spaces, and browse course connections across UTSG, UTM, and UTSC.",
  keywords: ["UofT students", "UofT programs", "UTSG study spaces", "University of Toronto community", "UofT social", "find UofT students"],
  alternates: { canonical: "https://varsio.vercel.app/explore" },
  openGraph: {
    url: "https://varsio.vercel.app/explore",
    title: "Explore UofT | Varsio",
    description: "Discover UofT students by program and year, and find open study spaces across all three campuses.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore UofT | Varsio",
    description: "Discover UofT students by program and year across UTSG, UTM, and UTSC.",
    images: ["/opengraph-image"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
