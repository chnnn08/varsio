"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { track } from "@vercel/analytics";
import Link from "next/link";

type Tab = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    track("user_signed_in");
    router.push("/profile");
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    track("user_signed_up");
    setSuccess("Account created! Check your email to confirm, then sign in.");
    setLoading(false);
    setTab("signin");
    setPassword("");
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#F0B429] flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <path d="M8 10.5 Q8 7 11.5 7 H16.5 Q20 7 20 10.5 Q20 14 14 14" stroke="#002A5C" strokeWidth="2.6" fill="none" strokeLinecap="round" />
                <path d="M20 17.5 Q20 21 16.5 21 H11.5 Q8 21 8 17.5 Q8 14 14 14" stroke="#002A5C" strokeWidth="2.6" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[#002A5C] font-bold text-lg">Varsio</span>
          </Link>
          <p className="text-gray-400 text-sm mt-2">The student platform UofT actually needed.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(["signin", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); setSuccess(""); }}
                className={`flex-1 py-3.5 text-sm font-bold transition-all ${
                  tab === t ? "text-[#002A5C] border-b-2 border-[#002A5C]" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {t === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form
            onSubmit={tab === "signin" ? handleSignIn : handleSignUp}
            className="p-6 space-y-4"
          >
            {success && (
              <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
                {success}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                University Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@mail.utoronto.ca"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === "signup" ? "At least 6 characters" : "Your password"}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#002A5C] text-white font-bold py-3.5 rounded-xl text-sm hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {tab === "signin" ? "Sign In" : "Create Account"}
            </button>

            {tab === "signin" && (
              <p className="text-center text-xs text-gray-400">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setTab("signup"); setError(""); }}
                  className="text-[#002A5C] font-semibold hover:underline"
                >
                  Sign up free
                </button>
              </p>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          By signing up you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
