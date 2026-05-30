import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz Bank",
  description: "Create quizzes manually or generate them from lecture notes with AI. Share with a code so friends can take them.",
  alternates: { canonical: "https://varsio.vercel.app/quiz" },
  openGraph: { url: "https://varsio.vercel.app/quiz", title: "Quiz Bank | Varsio" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
