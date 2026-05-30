import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Study Sessions",
  description: "Paste your notes, invite your study group, and let AI generate quizzes tailored to your material. Built for UofT students.",
  alternates: { canonical: "https://varsio.netlify.app/study" },
  openGraph: { url: "https://varsio.netlify.app/study", title: "AI Study Sessions | Varsio" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
