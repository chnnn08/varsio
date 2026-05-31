import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-[80vh] bg-[#F4F6F9] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-[#002A5C] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-3xl font-black">404</span>
        </div>
        <h1 className="text-2xl font-black text-black mb-2">Page not found</h1>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          This page doesn&apos;t exist or was moved. Head back and keep exploring.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-[#002A5C] text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-black transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/match"
            className="border border-gray-200 text-gray-600 font-semibold px-6 py-3 rounded-xl text-sm hover:border-[#002A5C] hover:text-[#002A5C] transition-colors"
          >
            Course Matcher
          </Link>
          <Link
            href="/study"
            className="border border-gray-200 text-gray-600 font-semibold px-6 py-3 rounded-xl text-sm hover:border-[#002A5C] hover:text-[#002A5C] transition-colors"
          >
            Study Sessions
          </Link>
        </div>
      </div>
    </div>
  );
}
