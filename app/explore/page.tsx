"use client";

import { useState } from "react";

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

const SWAPS = [
  { id: 1, have: "CSC108H1 LEC0101", want: "LEC0201", name: "A.K.", posted: "2h ago" },
  { id: 2, have: "MAT137Y1 LEC0301", want: "LEC0101", name: "M.T.", posted: "5h ago" },
  { id: 3, have: "ECO101H1 LEC5101", want: "LEC5201", name: "J.L.", posted: "1d ago" },
];

const SPACES = [
  { name: "Robarts Library", floor: "Floor 4", noise: "Silent", available: true, spots: 12 },
  { name: "Gerstein Library", floor: "Floor 2", noise: "Quiet", available: true, spots: 5 },
  { name: "Bahen Centre", floor: "Room B024", noise: "Collaborative", available: false, spots: 0 },
  { name: "Sidney Smith Hall", floor: "Floor 1", noise: "Moderate", available: true, spots: 8 },
  { name: "New College Library", floor: "Main Floor", noise: "Silent", available: true, spots: 20 },
];

const PROFS = [
  { name: "D. Liu", course: "CSC108H1", difficulty: 3.2, rating: 4.5, reviews: 142 },
  { name: "A. Heap", course: "MAT137Y1", difficulty: 4.8, rating: 4.7, reviews: 210 },
  { name: "M. Guerzhoy", course: "CSC148H1", difficulty: 3.8, rating: 4.1, reviews: 98 },
  { name: "P. Krugman", course: "ECO101H1", difficulty: 2.9, rating: 3.8, reviews: 76 },
];

type Tab = "connections" | "swap" | "spaces" | "profs";

const tabs: { id: Tab; label: string }[] = [
  { id: "connections", label: "Course Connections" },
  { id: "swap", label: "Section Swap" },
  { id: "spaces", label: "Study Spaces" },
  { id: "profs", label: "Prof Ratings" },
];

export default function ExplorePage() {
  const [tab, setTab] = useState<Tab>("connections");
  const [swapHave, setSwapHave] = useState("");
  const [swapWant, setSwapWant] = useState("");
  const [swaps, setSwaps] = useState(SWAPS);

  function postSwap() {
    if (!swapHave.trim() || !swapWant.trim()) return;
    setSwaps([{ id: Date.now(), have: swapHave.trim(), want: swapWant.trim(), name: "You", posted: "just now" }, ...swaps]);
    setSwapHave("");
    setSwapWant("");
  }

  function difficultyColor(d: number) {
    if (d >= 4) return "text-red-500";
    if (d >= 3) return "text-amber-500";
    return "text-green-600";
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
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-all -mb-px whitespace-nowrap ${
              tab === t.id
                ? "border-[#002A5C] text-[#002A5C]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Course Connections */}
      {tab === "connections" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-bold text-[#002A5C] mb-1">Courses Commonly Taken Together</h2>
          <p className="text-gray-400 text-xs mb-6">Based on aggregated student timetable data</p>
          <div className="space-y-4">
            {CONNECTIONS.map((c, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="font-mono text-xs font-bold text-[#002A5C] w-24 shrink-0">{c.from}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-[#002A5C] h-2 rounded-full" style={{ width: `${c.pct}%` }} />
                </div>
                <span className="font-mono text-xs font-bold text-[#002A5C] w-24 shrink-0 text-right">{c.to}</span>
                <span className="text-xs text-gray-400 w-8 text-right shrink-0">{c.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Swap */}
      {tab === "swap" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="font-bold text-[#002A5C] mb-4">Post a Swap Request</h2>
            <div className="flex gap-3 flex-wrap items-end">
              <div className="flex-1 min-w-40">
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1.5">I have</label>
                <input
                  value={swapHave}
                  onChange={(e) => setSwapHave(e.target.value)}
                  placeholder="e.g. CSC108H1 LEC0101"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                />
              </div>
              <div className="flex-1 min-w-40">
                <label className="block text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1.5">I want</label>
                <input
                  value={swapWant}
                  onChange={(e) => setSwapWant(e.target.value)}
                  placeholder="e.g. LEC0201"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                />
              </div>
              <button
                onClick={postSwap}
                className="bg-[#002A5C] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#003d80] transition-colors shrink-0"
              >
                Post
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {swaps.map((s) => (
              <div key={s.id} className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-[#002A5C]">Have</span> {s.have}
                    <span className="text-gray-300 mx-2">·</span>
                    <span className="font-semibold text-[#002A5C]">Want</span> {s.want}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{s.name} · {s.posted}</p>
                </div>
                <button className="text-xs font-bold text-[#002A5C] border border-[#002A5C]/20 px-3 py-1.5 rounded-lg hover:bg-[#002A5C] hover:text-white transition-all">
                  Contact
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Study Spaces */}
      {tab === "spaces" && (
        <div className="grid sm:grid-cols-2 gap-4">
          {SPACES.map((s) => (
            <div key={s.name} className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-[#002A5C] text-sm">{s.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{s.floor}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  s.available ? "bg-green-50 text-green-600" : "bg-red-50 text-red-400"
                }`}>
                  {s.available ? "Available" : "Full"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{s.noise}</span>
                <span className="font-semibold text-[#002A5C]">
                  {s.available ? `${s.spots} seats open` : "No seats"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prof Ratings */}
      {tab === "profs" && (
        <div className="space-y-3">
          {PROFS.map((p) => (
            <div key={p.name} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-[#002A5C] text-white flex items-center justify-center font-black text-sm shrink-0">
                {p.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#002A5C] text-sm">{p.name}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{p.course}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-amber-400 font-bold">{"â˜…".repeat(Math.round(p.rating))}{"â˜†".repeat(5 - Math.round(p.rating))}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.reviews} reviews</p>
              </div>
              <div className="text-right shrink-0 w-16">
                <p className={`text-xl font-black ${difficultyColor(p.difficulty)}`}>{p.difficulty}</p>
                <p className="text-xs text-gray-400">difficulty</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  );
}
