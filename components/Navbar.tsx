"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/match", label: "Match" },
  { href: "/study", label: "Study" },
  { href: "/chat", label: "Chat" },
  { href: "/tools", label: "Tools" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/explore", label: "Explore" },
];

function VarsioIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="7" fill="#F0B429" />
      <path d="M8 10.5 Q8 7 11.5 7 H16.5 Q20 7 20 10.5 Q20 14 14 14" stroke="#002A5C" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M20 17.5 Q20 21 16.5 21 H11.5 Q8 21 8 17.5 Q8 14 14 14" stroke="#002A5C" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-[#002A5C] sticky top-0 z-50 border-b border-white/8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
          <VarsioIcon />
          <span className="text-white font-bold text-base tracking-tight">Varsio</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-0.5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                pathname === link.href
                  ? "bg-white/12 text-white"
                  : "text-white/50 hover:text-white hover:bg-white/8"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/profile"
            className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${
              pathname === "/profile"
                ? "bg-[#F0B429] text-[#002A5C]"
                : "bg-[#F0B429] text-[#002A5C] hover:bg-yellow-400"
            }`}
          >
            {pathname === "/profile" ? "Profile" : "Get Started"}
          </Link>
        </div>

        {/* Mobile: profile + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all ${
              pathname === "/profile" ? "bg-[#F0B429] text-[#002A5C]" : "bg-white/15 text-white"
            }`}
          >
            P
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-white transition-all origin-center ${open ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all ${open ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all origin-center ${open ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#001d40] border-t border-white/8 px-4 py-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-1 ${
                pathname === link.href
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/8 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center mt-2 bg-[#F0B429] text-[#002A5C] font-bold px-4 py-3 rounded-xl text-sm"
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}

