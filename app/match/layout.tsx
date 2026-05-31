import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Course Matcher",
  description: "See exactly which courses and sections you share with your friends at UofT. Upload your ACORN timetable or enter courses manually — get your matches in seconds.",
  keywords: ["UofT course matcher", "ACORN timetable", "UofT schedule", "course overlap", "UofT friends", "UTSG courses", "UTM courses", "UTSC courses"],
  alternates: { canonical: "https://varsio.vercel.app/match" },
  openGraph: {
    url: "https://varsio.vercel.app/match",
    title: "Course Matcher | Varsio",
    description: "See exactly which courses and sections you share with your friends at UofT. Upload your ACORN timetable or enter courses manually.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Course Matcher | Varsio",
    description: "See exactly which courses and sections you share with your friends at UofT.",
    images: ["/opengraph-image"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
