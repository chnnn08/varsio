import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Study Sessions",
  description: "Paste your notes, invite your study group, and let AI generate quizzes tailored to your material. Built for UofT students.",
  alternates: { canonical: "https://varsio.vercel.app/study" },
  openGraph: { url: "https://varsio.vercel.app/study", title: "AI Study Sessions | Varsio" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
