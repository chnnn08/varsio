"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/lib/profile";

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

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setLoggedIn(!!user);
      if (user) {
        const p = await getProfile();
        if (p?.displayName) setProfileName(p.displayName);
      } else {
        setProfileName(null);
      }
    }
    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => subscription.unsubscribe();
  }, [pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    setProfileName(null);
    setLoggedIn(false);
    router.push("/");
  }

  return (
    <nav className="bg-[#002A5C] sticky top-0 z-50 border-b border-white/8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
          <VarsioIcon />
          <span className="text-white font-bold text-base tracking-tight">Varsio</span>
        </Link>

        <div className="hidden md:flex items-center gap-0.5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                pathname === link.href || pathname.startsWith(link.href + "?")
                  ? "bg-white/12 text-white"
                  : "text-white/50 hover:text-white hover:bg-white/8"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {loggedIn ? (
            <>
              <Link
                href="/profile"
                className="bg-[#F0B429] text-[#002A5C] text-xs font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 transition-all"
              >
                {profileName ? initials(profileName) : "Profile"}
              </Link>
              <button
                onClick={signOut}
                className="text-white/50 hover:text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-white/8 transition-all"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-[#F0B429] text-[#002A5C] text-xs font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 transition-all"
            >
              Sign In
            </Link>
          )}
        </div>

        <div className="flex md:hidden items-center gap-2">
          {loggedIn ? (
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black bg-[#F0B429] text-[#002A5C] transition-all hover:bg-yellow-400"
            >
              {profileName ? initials(profileName) : "?"}
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black bg-[#F0B429] text-[#002A5C] transition-all hover:bg-yellow-400"
            >
              In
            </Link>
          )}
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

      {open && (
        <div className="md:hidden bg-[#001d40] border-t border-white/8 px-4 py-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-1 ${
                pathname === link.href ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/8 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {loggedIn ? (
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="w-full flex items-center justify-center mt-2 bg-white/10 text-white/70 font-bold px-4 py-3 rounded-xl text-sm"
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center mt-2 bg-[#F0B429] text-[#002A5C] font-bold px-4 py-3 rounded-xl text-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
