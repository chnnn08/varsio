"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getProfile, type Profile } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

type Tab = "connections" | "swap" | "spaces" | "profs";

type Swap = { id: string; poster_name: string; have: string; want: string; created_at: string };

type Prof = { name: string; course: string; rating: number; difficulty: number; reviews: number };

const CONNECTIONS = [
  { from: "CSC108H1", to: "CSC148H1", pct: 94 },
  { from: "CSC148H1", to: "CSC207H1", pct: 88 },
  { from: "MAT137Y1", to: "MAT237Y1", pct: 91 },
  { from: "ECO101H1", to: "ECO102H1", pct: 85 },
  { from: "CSC207H1", to: "CSC263H1", pct: 79 },
  { from: "MAT137Y1", to: "CSC165H1", pct: 72 },
  { from: "BIO120H1", to: "BIO130H1", pct: 96 },
  { from: "CHM135H1", to: "CHM136H1", pct: 93 },
];

const SPACES = [
  { name: "Robarts Library", floor: "Floor 4", noise: "Silent", capacity: 12 },
  { name: "Gerstein Library", floor: "Floor 2", noise: "Quiet", capacity: 8 },
  { name: "Bahen Centre", floor: "Room B024", noise: "Collaborative", capacity: 6 },
  { name: "Sidney Smith Hall", floor: "Floor 1", noise: "Moderate", capacity: 10 },
  { name: "New College Library", floor: "Main Floor", noise: "Silent", capacity: 20 },
];

const SEED_PROFS: Prof[] = [
  { name: "D. Liu", course: "CSC108H1", difficulty: 3.2, rating: 4.5, reviews: 142 },
  { name: "A. Heap", course: "MAT137Y1", difficulty: 4.8, rating: 4.7, reviews: 210 },
  { name: "M. Guerzhoy", course: "CSC148H1", difficulty: 3.8, rating: 4.1, reviews: 98 },
  { name: "P. Krugman", course: "ECO101H1", difficulty: 2.9, rating: 3.8, reviews: 76 },
];

const tabs: { id: Tab; label: string }[] = [
  { id: "connections", label: "Course Connections" },
  { id: "swap", label: "Section Swap" },
  { id: "spaces", label: "Study Spaces" },
  { id: "profs", label: "Prof Ratings" },
];

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className={`text-xl transition-colors ${n <= value ? "text-[#F0B429]" : "text-gray-200 hover:text-yellow-300"}`}>
          ★
        </button>
      ))}
    </div>
  );
}

export default function ExplorePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("connections");
  const [profile, setProfile] = useState<Profile | null>(null);

  // Section swap state
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [swapHave, setSwapHave] = useState("");
  const [swapWant, setSwapWant] = useState("");
  const [posting, setPosting] = useState(false);

  // Space check-in state (per space: number of current checkins)
  const [checkins, setCheckins] = useState<Record<string, number>>({});
  const [myCheckin, setMyCheckin] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);

  // Prof rating state
  const [profs, setProfs] = useState<Prof[]>(SEED_PROFS);
  const [showRateForm, setShowRateForm] = useState(false);
  const [rateForm, setRateForm] = useState({ prof: "", course: "", rating: 0, difficulty: 0 });
  const [submittingRating, setSubmittingRating] = useState(false);
  const [myRatings, setMyRatings] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function init() {
      const p = await getProfile();
      setProfile(p);
      await Promise.all([loadSwaps(), loadCheckins(p), loadProfRatings(p)]);
    }
    init();
  }, []);

  // -- Section Swap --
  async function loadSwaps() {
    const { data } = await supabase.from("section_swaps")
      .select("*").order("created_at", { ascending: false }).limit(30);
    if (data) setSwaps(data as Swap[]);
  }

  async function postSwap() {
    if (!swapHave.trim() || !swapWant.trim() || !profile) return;
    setPosting(true);
    await supabase.from("section_swaps").insert({
      poster_name: profile.displayName,
      have: swapHave.trim().toUpperCase(),
      want: swapWant.trim().toUpperCase(),
    });
    setSwapHave(""); setSwapWant("");
    await loadSwaps();
    setPosting(false);
  }

  async function deleteSwap(id: string) {
    await supabase.from("section_swaps").delete().eq("id", id);
    setSwaps((prev) => prev.filter((s) => s.id !== id));
  }

  // -- Study Spaces --
  async function loadCheckins(p: Profile | null) {
    const { data } = await supabase.from("space_checkins").select("space_name, user_name");
    if (!data) return;
    const counts: Record<string, number> = {};
    for (const row of data) {
      counts[row.space_name as string] = (counts[row.space_name as string] ?? 0) + 1;
    }
    setCheckins(counts);
    if (p) {
      const myRow = data.find((r) => (r.user_name as string).toLowerCase() === p.displayName.toLowerCase());
      if (myRow) setMyCheckin(myRow.space_name as string);
    }
  }

  async function toggleCheckin(spaceName: string) {
    if (!profile || checkingIn) return;
    setCheckingIn(true);
    if (myCheckin === spaceName) {
      await supabase.from("space_checkins")
        .delete().eq("space_name", spaceName).eq("user_name", profile.displayName);
      setMyCheckin(null);
      setCheckins((prev) => ({ ...prev, [spaceName]: Math.max(0, (prev[spaceName] ?? 0) - 1) }));
    } else {
      if (myCheckin) {
        await supabase.from("space_checkins")
          .delete().eq("space_name", myCheckin).eq("user_name", profile.displayName);
        setCheckins((prev) => ({ ...prev, [myCheckin]: Math.max(0, (prev[myCheckin] ?? 0) - 1) }));
      }
      await supabase.from("space_checkins").upsert({
        space_name: spaceName,
        user_name: profile.displayName,
      });
      setMyCheckin(spaceName);
      setCheckins((prev) => ({ ...prev, [spaceName]: (prev[spaceName] ?? 0) + 1 }));
    }
    setCheckingIn(false);
  }

  // -- Prof Ratings --
  async function loadProfRatings(p: Profile | null) {
    const { data } = await supabase.from("prof_ratings").select("prof_name, course, rating, difficulty, rater_name");
    if (!data || data.length === 0) return;

    const map = new Map<string, { sumR: number; sumD: number; count: number }>();
    for (const row of data) {
      const key = `${row.prof_name}|${row.course}`;
      const e = map.get(key) ?? { sumR: 0, sumD: 0, count: 0 };
      map.set(key, { sumR: e.sumR + (row.rating as number), sumD: e.sumD + (row.difficulty as number), count: e.count + 1 });
    }

    const rated: Record<string, boolean> = {};
    if (p) {
      for (const row of data) {
        if ((row.rater_name as string).toLowerCase() === p.displayName.toLowerCase()) {
          rated[`${row.prof_name}|${row.course}`] = true;
        }
      }
    }
    setMyRatings(rated);

    setProfs(() => {
      const updated = SEED_PROFS.map((prof) => {
        const key = `${prof.name}|${prof.course}`;
        const agg = map.get(key);
        if (!agg) return prof;
        map.delete(key);
        return {
          ...prof,
          rating: Math.round((agg.sumR / agg.count) * 10) / 10,
          difficulty: Math.round((agg.sumD / agg.count) * 10) / 10,
          reviews: agg.count,
        };
      });
      const extra: Prof[] = [];
      for (const [key, agg] of map.entries()) {
        const [name, course] = key.split("|");
        extra.push({
          name, course,
          rating: Math.round((agg.sumR / agg.count) * 10) / 10,
          difficulty: Math.round((agg.sumD / agg.count) * 10) / 10,
          reviews: agg.count,
        });
      }
      return [...updated, ...extra];
    });
  }

  async function submitRating() {
    if (!profile || !rateForm.prof.trim() || !rateForm.course.trim() || rateForm.rating === 0) return;
    setSubmittingRating(true);
    await supabase.from("prof_ratings").upsert({
      prof_name: rateForm.prof.trim(),
      course: rateForm.course.trim().toUpperCase(),
      rater_name: profile.displayName,
      rating: rateForm.rating,
      difficulty: rateForm.difficulty || 3,
    });
    setRateForm({ prof: "", course: "", rating: 0, difficulty: 0 });
    setShowRateForm(false);
    await loadProfRatings(profile);
    setSubmittingRating(false);
  }

  function difficultyColor(d: number) {
    if (d >= 4) return "text-red-500";
    if (d >= 3) return "text-amber-500";
    return "text-green-600";
  }

  function fmtTime(iso: string) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-[#002A5C] text-white pt-14 pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Explore</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">Discover UofT.</h1>
          <p className="text-white/50 text-lg">Course connections, section swaps, study spaces, and professor ratings.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto border-b border-gray-200 pb-0 scrollbar-hide">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap ${
                tab === t.id ? "border-[#002A5C] text-[#002A5C]" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── COURSE CONNECTIONS ──────────────────────────────────── */}
        {tab === "connections" && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="font-bold text-[#002A5C] mb-1">Courses Commonly Taken Together</h2>
            <p className="text-gray-400 text-xs mb-6">Based on aggregated UofT student timetable data</p>
            <div className="space-y-4">
              {CONNECTIONS.map((c, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="font-mono text-xs font-bold text-[#002A5C] w-24 shrink-0">{c.from}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-[#002A5C] h-2 rounded-full transition-all" style={{ width: `${c.pct}%` }} />
                  </div>
                  <span className="font-mono text-xs font-bold text-[#002A5C] w-24 shrink-0 text-right">{c.to}</span>
                  <span className="text-xs text-gray-400 w-8 text-right shrink-0">{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION SWAP ────────────────────────────────────────── */}
        {tab === "swap" && (
          <div className="space-y-4">
            {/* Post form */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h2 className="font-bold text-[#002A5C] mb-1">Post a Swap Request</h2>
              {profile ? (
                <>
                  <p className="text-xs text-gray-400 mb-4">Posting as <span className="font-semibold">{profile.displayName}</span></p>
                  <div className="flex gap-3 flex-wrap items-end">
                    <div className="flex-1 min-w-40">
                      <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1.5">I have</label>
                      <input value={swapHave} onChange={(e) => setSwapHave(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && postSwap()}
                        placeholder="e.g. CSC108H1 LEC0101"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                      />
                    </div>
                    <div className="flex-1 min-w-40">
                      <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1.5">I want</label>
                      <input value={swapWant} onChange={(e) => setSwapWant(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && postSwap()}
                        placeholder="e.g. LEC0201"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                      />
                    </div>
                    <button onClick={postSwap} disabled={posting || !swapHave.trim() || !swapWant.trim()}
                      className="bg-[#002A5C] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-black transition-colors shrink-0 disabled:opacity-40"
                    >
                      {posting ? "Posting..." : "Post"}
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  <Link href="/profile" className="text-[#002A5C] font-semibold hover:underline">Create a profile</Link> to post a swap request.
                </p>
              )}
            </div>

            {/* Swap listings */}
            {swaps.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl text-center py-16 text-gray-300">
                <p className="text-sm font-semibold">No swap requests yet — be the first to post</p>
              </div>
            ) : (
              <div className="space-y-2">
                {swaps.map((s) => {
                  const isMe = profile?.displayName.toLowerCase() === s.poster_name.toLowerCase();
                  return (
                    <div key={s.id} className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">
                          <span className="font-bold text-[#002A5C]">Have</span>{" "}
                          <span className="font-mono">{s.have}</span>
                          <span className="text-gray-300 mx-2">·</span>
                          <span className="font-bold text-[#002A5C]">Want</span>{" "}
                          <span className="font-mono">{s.want}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          <Link href={`/profile/${encodeURIComponent(s.poster_name)}`} className="font-semibold hover:underline">
                            {s.poster_name}
                          </Link>
                          {" · "}{fmtTime(s.created_at)}
                        </p>
                      </div>
                      {isMe ? (
                        <button onClick={() => deleteSwap(s.id)}
                          className="text-xs font-semibold text-gray-300 hover:text-red-400 transition-colors shrink-0 px-3 py-1.5">
                          Delete
                        </button>
                      ) : profile ? (
                        <button onClick={() => router.push(`/chat?tab=dm&with=${encodeURIComponent(s.poster_name)}`)}
                          className="text-xs font-bold text-[#002A5C] border border-[#002A5C]/20 px-4 py-2 rounded-xl hover:bg-[#002A5C] hover:text-white transition-all shrink-0">
                          Contact
                        </button>
                      ) : (
                        <Link href="/profile"
                          className="text-xs font-bold text-gray-400 border border-gray-200 px-4 py-2 rounded-xl hover:border-[#002A5C] hover:text-[#002A5C] transition-all shrink-0">
                          Sign in to contact
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── STUDY SPACES ────────────────────────────────────────── */}
        {tab === "spaces" && (
          <div className="space-y-4">
            <div className="bg-[#002A5C]/5 border border-[#002A5C]/10 rounded-2xl px-5 py-3">
              <p className="text-xs text-[#002A5C] font-semibold">
                Check in to let others know you&apos;re at a space. Check-ins are visible to all users.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {SPACES.map((s) => {
                const here = checkins[s.name] ?? 0;
                const isMeHere = myCheckin === s.name;
                const available = here < s.capacity;
                return (
                  <div key={s.name} className="bg-white border border-gray-100 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-[#002A5C] text-sm">{s.name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{s.floor}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${available ? "bg-green-50 text-green-600" : "bg-red-50 text-red-400"}`}>
                        {available ? "Open" : "Full"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-4">
                      <span className="text-gray-500">{s.noise}</span>
                      <span className="font-semibold text-[#002A5C]">
                        {here} / {s.capacity} checked in
                      </span>
                    </div>
                    {profile ? (
                      <button onClick={() => toggleCheckin(s.name)} disabled={checkingIn}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                          isMeHere
                            ? "bg-[#002A5C] text-white hover:bg-black"
                            : "border border-[#002A5C]/20 text-[#002A5C] hover:bg-[#002A5C] hover:text-white"
                        }`}>
                        {isMeHere ? "✓ Checked In — Leave" : "Check In Here"}
                      </button>
                    ) : (
                      <Link href="/profile" className="block w-full py-2 rounded-xl text-xs font-bold text-center border border-gray-200 text-gray-400 hover:border-[#002A5C] hover:text-[#002A5C] transition-all">
                        Sign in to check in
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PROF RATINGS ────────────────────────────────────────── */}
        {tab === "profs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Ratings submitted by UofT students. One rating per prof per user.</p>
              {profile && (
                <button onClick={() => setShowRateForm(!showRateForm)}
                  className="text-xs font-bold px-4 py-2 rounded-xl bg-[#002A5C] text-white hover:bg-black transition-colors">
                  + Rate a Prof
                </button>
              )}
            </div>

            {/* Rate form */}
            {showRateForm && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
                <h2 className="font-black text-black">Rate a Professor</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Prof Name</label>
                    <input value={rateForm.prof} onChange={(e) => setRateForm((f) => ({ ...f, prof: e.target.value }))}
                      placeholder="e.g. D. Liu"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Course</label>
                    <input value={rateForm.course} onChange={(e) => setRateForm((f) => ({ ...f, course: e.target.value }))}
                      placeholder="e.g. CSC108H1"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Rating</label>
                    <StarPicker value={rateForm.rating} onChange={(v) => setRateForm((f) => ({ ...f, rating: v }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Difficulty (1–5)</label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" onClick={() => setRateForm((f) => ({ ...f, difficulty: n }))}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            rateForm.difficulty === n ? "bg-[#002A5C] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={submitRating} disabled={submittingRating || !rateForm.prof.trim() || !rateForm.course.trim() || rateForm.rating === 0}
                    className="flex-1 bg-[#002A5C] text-white font-bold py-3 rounded-xl text-sm hover:bg-black transition-colors disabled:opacity-40">
                    {submittingRating ? "Submitting..." : "Submit Rating"}
                  </button>
                  <button onClick={() => setShowRateForm(false)} className="px-5 border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl text-sm hover:border-gray-400 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Prof list */}
            <div className="space-y-3">
              {profs.map((p) => {
                const hasRated = myRatings[`${p.name}|${p.course}`];
                return (
                  <div key={`${p.name}-${p.course}`} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-[#002A5C] text-white flex items-center justify-center font-black text-sm shrink-0">
                      {p.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#002A5C] text-sm">{p.name}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{p.course}</p>
                      {hasRated && <p className="text-xs text-green-600 font-semibold mt-0.5">✓ You rated this prof</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-amber-400 font-bold">{"★".repeat(Math.round(p.rating))}{"☆".repeat(5 - Math.round(p.rating))}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.reviews} {p.reviews === 1 ? "rating" : "ratings"}</p>
                    </div>
                    <div className="text-right shrink-0 w-16">
                      <p className={`text-xl font-black ${difficultyColor(p.difficulty)}`}>{p.difficulty}</p>
                      <p className="text-xs text-gray-400">difficulty</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
