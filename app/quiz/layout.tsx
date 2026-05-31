import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz Bank",
  description: "Create shareable quizzes manually or generate them from your UofT lecture notes using AI. Share a 6-character code so friends can take your quiz.",
  keywords: ["UofT quiz", "quiz generator", "AI quiz from notes", "UofT exam prep", "university flashcards", "shareable quiz"],
  alternates: { canonical: "https://varsio.vercel.app/quiz" },
  openGraph: {
    url: "https://varsio.vercel.app/quiz",
    title: "Quiz Bank | Varsio",
    description: "Create shareable quizzes manually or generate them from your UofT lecture notes using AI.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quiz Bank | Varsio",
    description: "Create shareable quizzes from your UofT lecture notes using AI. Share with a 6-character code.",
    images: ["/opengraph-image"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
