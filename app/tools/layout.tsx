import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Tools",
  description: "Free tools built for UofT students: AI deadline tracker, grade calculator, and syllabus scanner tuned to UofT's course structure.",
  keywords: ["UofT grade calculator", "UofT deadline tracker", "CGPA calculator", "UofT syllabus", "university student tools", "UTSG tools"],
  alternates: { canonical: "https://varsio.vercel.app/tools" },
  openGraph: {
    url: "https://varsio.vercel.app/tools",
    title: "Student Tools | Varsio",
    description: "Free tools built for UofT students: AI deadline tracker, grade calculator, and syllabus scanner.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Student Tools | Varsio",
    description: "Free AI-powered tools built for UofT students: deadline tracker, grade calculator, and more.",
    images: ["/opengraph-image"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
