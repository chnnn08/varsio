import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Tools",
  description: "AI deadline tracker, grade calculator, and syllabus scanner built around UofT's course structure. Free for all UofT students.",
  alternates: { canonical: "https://varsio.netlify.app/tools" },
  openGraph: { url: "https://varsio.netlify.app/tools", title: "Student Tools | Varsio" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
