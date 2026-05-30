import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Profile",
  description: "Set up your Varsio profile, add your UofT courses, and start matching with friends across all three campuses.",
  alternates: { canonical: "https://varsio.vercel.app/profile" },
  openGraph: { url: "https://varsio.vercel.app/profile", title: "Your Profile | Varsio" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
