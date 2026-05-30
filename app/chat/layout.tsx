import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Course Chat",
  description: "Post questions and find study partners in profile-linked threads organized by course. For UofT students across all three campuses.",
  alternates: { canonical: "https://varsio.netlify.app/chat" },
  openGraph: { url: "https://varsio.netlify.app/chat", title: "Course Chat | Varsio" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
