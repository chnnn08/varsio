"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/lib/profile";
import Link from "next/link";

// â”€â”€ types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type Tutor = {
  id: string; name: string; course: string; subjects: string[];
  rate: number; bio: string; rating: number; sessions: number; available: boolean;
};

type Textbook = {
  id: string; title: string; course: string; author: string;
  edition: string; condition: "New" | "Like New" | "Good" | "Fair";
  price: number; seller: string; posted: string;
};

type Tab = "tutoring" | "textbooks";

// â”€â”€ mock data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const INITIAL_TUTORS: Tutor[] = [
  { id: "t1", name: "Alex K.", course: "CSC", subjects: ["CSC108H1", "CSC148H1", "CSC207H1"], rate: 25, bio: "4th year CS student. Helped 30+ students pass their first CS courses.", rating: 4.9, sessions: 47, available: true },
  { id: "t2", name: "Maya T.", course: "MAT", subjects: ["MAT137Y1", "MAT237Y1", "MAT224H1"], rate: 30, bio: "Math specialist. Patient with proofs and calculus. Available evenings.", rating: 4.8, sessions: 32, available: true },
  { id: "t3", name: "James W.", course: "ECO", subjects: ["ECO101H1", "ECO102H1", "ECO200Y1"], rate: 20, bio: "Economics + Stats double major. Great at visualizing concepts.", rating: 4.7, sessions: 18, available: false },
  { id: "t4", name: "Priya S.", course: "CHM", subjects: ["CHM135H1", "CHM136H1", "BCH210H1"], rate: 28, bio: "Biochem grad student. Tutored undergrads for 3 years.", rating: 5.0, sessions: 61, available: true },
];

const INITIAL_TEXTBOOKS: Textbook[] = [
  { id: "b1", title: "Introduction to the Theory of Computation", course: "CSC236H1", author: "Sipser", edition: "3rd", condition: "Good", price: 45, seller: "alex_cs", posted: "2d ago" },
  { id: "b2", title: "Calculus: Early Transcendentals", course: "MAT137Y1", author: "Stewart", edition: "8th", condition: "Like New", price: 60, seller: "james_w", posted: "1d ago" },
  { id: "b3", title: "Organic Chemistry", course: "CHM151Y1", author: "Clayden", edition: "2nd", condition: "Fair", price: 30, seller: "priya_s", posted: "3d ago" },
];

const CONDITIONS = ["New", "Like New", "Good", "Fair"] as const;
const CONDITION_COLORS: Record<string, string> = {
  "New": "bg-green-50 text-green-700",
  "Like New": "bg-[#1a8c4e]/10 text-[#1a8c4e]",
  "Good": "bg-blue-50 text-[#002A5C]",
  "Fair": "bg-yellow-50 text-yellow-700",
};

function Stars({ n }: { n: number }) {
  return (
    <span className="text-[#F0B429]">
      {"â˜…".repeat(Math.floor(n))}{"â˜†".repeat(5 - Math.floor(n))}
    </span>
  );
}

// â”€â”€ component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function MarketplacePage() {
  const [tab, setTab] = useState<Tab>("tutoring");
  const [profileName, setProfileName] = useState<string | null>(null);

  // Tutoring
  const [tutors, setTutors] = useState<Tutor[]>(INITIAL_TUTORS);
  const [tutorSearch, setTutorSearch] = useState("");
  const [showTutorForm, setShowTutorForm] = useState(false);
  const [tutorForm, setTutorForm] = useState({ subjects: "", rate: "", bio: "" });

  // Textbooks
  const [textbooks, setTextbooks] = useState<Textbook[]>(INITIAL_TEXTBOOKS);
  const [bookSearch, setBookSearch] = useState("");
  const [showBookForm, setShowBookForm] = useState(false);
  const [bookForm, setBookForm] = useState({ title: "", course: "", author: "", edition: "", condition: "Good" as Textbook["condition"], price: "" });

  useEffect(() => {
    const p = getProfile();
    setProfileName(p?.displayName ?? null);
  }, []);

  // Tutor functions
  function listAsTutor() {
    if (!profileName || !tutorForm.subjects.trim() || !tutorForm.rate) return;
    const subjects = tutorForm.subjects.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    const newTutor: Tutor = {
      id: crypto.randomUUID(), name: profileName,
      course: subjects[0]?.substring(0, 3) ?? "GEN",
      subjects, rate: parseFloat(tutorForm.rate), bio: tutorForm.bio.trim(),
      rating: 0, sessions: 0, available: true,
    };
    setTutors((prev) => [newTutor, ...prev]);
    setTutorForm({ subjects: "", rate: "", bio: "" });
    setShowTutorForm(false);
  }

  // Textbook functions
  function listTextbook() {
    if (!profileName || !bookForm.title.trim() || !bookForm.price) return;
    const newBook: Textbook = {
      id: crypto.randomUUID(), ...bookForm,
      price: parseFloat(bookForm.price), seller: profileName, posted: "just now",
    };
    setTextbooks((prev) => [newBook, ...prev]);
    setBookForm({ title: "", course: "", author: "", edition: "", condition: "Good", price: "" });
    setShowBookForm(false);
  }

  const filteredTutors = tutors.filter((t) =>
    !tutorSearch || t.subjects.some((s) => s.toLowerCase().includes(tutorSearch.toLowerCase())) ||
    t.name.toLowerCase().includes(tutorSearch.toLowerCase())
  );

  const filteredBooks = textbooks.filter((b) =>
    !bookSearch ||
    b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
    b.course.toLowerCase().includes(bookSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      {/* Header */}
      <div className="bg-[#002A5C] text-white py-12 px-6">
        <div className="max-w-5xl mx-auto flex items-end justify-between gap-4">
          <div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Marketplace</p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">Marketplace</h1>
            <p className="text-white/50 text-sm">Find tutors, buy and sell textbooks â€” within the UofT community.</p>
          </div>
          {tab === "tutoring" ? (
            <button onClick={() => setShowTutorForm(!showTutorForm)} className="shrink-0 bg-[#F0B429] text-black font-bold px-6 py-3 rounded-xl text-sm hover:bg-yellow-400 transition-colors">
              Become a Tutor
            </button>
          ) : (
            <button onClick={() => setShowBookForm(!showBookForm)} className="shrink-0 bg-[#F0B429] text-black font-bold px-6 py-3 rounded-xl text-sm hover:bg-yellow-400 transition-colors">
              List a Textbook
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white border border-gray-100 rounded-2xl p-1.5 w-fit">
          {([["tutoring", "Tutoring"], ["textbooks", "Textbooks"]] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t ? "bg-[#002A5C] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* â”€â”€ TUTORING â”€â”€ */}
        {tab === "tutoring" && (
          <div className="space-y-4">
            {/* Become a tutor form */}
            {showTutorForm && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <h2 className="font-black text-black mb-1">Become a Tutor</h2>
                <p className="text-xs text-gray-400 mb-4">
                  {profileName ? `Listing as ${profileName}` : <span>You need a <Link href="/profile" className="text-[#002A5C] font-semibold">profile</Link> to list as a tutor.</span>}
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Courses You Tutor</label>
                    <input value={tutorForm.subjects} onChange={(e) => setTutorForm({ ...tutorForm, subjects: e.target.value })} placeholder="e.g. CSC108H1, CSC148H1, MAT137Y1" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#002A5C]" />
                    <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Hourly Rate (CAD)</label>
                    <input type="number" value={tutorForm.rate} onChange={(e) => setTutorForm({ ...tutorForm, rate: e.target.value })} placeholder="e.g. 25" className="w-32 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Bio</label>
                    <textarea value={tutorForm.bio} onChange={(e) => setTutorForm({ ...tutorForm, bio: e.target.value })} placeholder="Tell students about your background and teaching styleâ€¦" rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#002A5C]" />
                  </div>
                  <button onClick={listAsTutor} disabled={!profileName} className="w-full bg-[#002A5C] text-white font-bold py-3 rounded-xl text-sm hover:bg-black transition-colors disabled:opacity-40">
                    List as Tutor â†’
                  </button>
                </div>
              </div>
            )}

            {/* Varsio Pro note */}
            <div className="bg-[#F0B429]/10 border border-[#F0B429]/30 rounded-2xl px-5 py-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-yellow-800">Varsio Pro tutors get priority placement and profile badges</p>
              <Link href="/#pricing" className="text-xs font-bold text-yellow-800 hover:text-black transition-colors">Upgrade â†’</Link>
            </div>

            {/* Search */}
            <input
              value={tutorSearch}
              onChange={(e) => setTutorSearch(e.target.value)}
              placeholder="Search by course or name (e.g. CSC108H1)â€¦"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
            />

            {/* Tutor cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredTutors.map((t) => (
                <div key={t.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#002A5C] text-white font-black flex items-center justify-center text-sm shrink-0">
                        {t.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-bold text-black text-sm">{t.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Stars n={t.rating} />
                          <span className="text-xs text-gray-400">{t.rating > 0 ? `${t.rating} · ${t.sessions} sessions` : "New tutor"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-[#002A5C] text-lg">${t.rate}</p>
                      <p className="text-xs text-gray-400">/hr</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{t.bio}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {t.subjects.map((s) => (
                      <span key={s} className="bg-[#002A5C]/8 text-[#002A5C] text-xs font-bold px-2.5 py-1 rounded-lg font-mono">{s}</span>
                    ))}
                  </div>
                  <button className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${t.available ? "bg-[#1a8c4e] text-white hover:bg-green-700" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                    {t.available ? "Book Session" : "Unavailable"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* â”€â”€ TEXTBOOKS â”€â”€ */}
        {tab === "textbooks" && (
          <div className="space-y-4">
            {/* List form */}
            {showBookForm && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <h2 className="font-black text-black mb-4">List a Textbook</h2>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} placeholder="Book title" className="col-span-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]" />
                  <input value={bookForm.course} onChange={(e) => setBookForm({ ...bookForm, course: e.target.value.toUpperCase() })} placeholder="Course (e.g. MAT137Y1)" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#002A5C]" />
                  <input value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} placeholder="Author" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]" />
                  <input value={bookForm.edition} onChange={(e) => setBookForm({ ...bookForm, edition: e.target.value })} placeholder="Edition (e.g. 3rd)" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]" />
                  <input type="number" value={bookForm.price} onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })} placeholder="Price (CAD)" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]" />
                </div>
                <div className="flex gap-2 mb-4">
                  {CONDITIONS.map((c) => (
                    <button key={c} onClick={() => setBookForm({ ...bookForm, condition: c })} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${bookForm.condition === c ? "bg-[#002A5C] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{c}</button>
                  ))}
                </div>
                <button onClick={listTextbook} disabled={!profileName} className="w-full bg-[#002A5C] text-white font-bold py-3 rounded-xl text-sm hover:bg-black transition-colors disabled:opacity-40">
                  List Textbook â†’
                </button>
              </div>
            )}

            {/* Search */}
            <input
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              placeholder="Search by title or course codeâ€¦"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
            />

            {/* Listings */}
            <div className="space-y-3">
              {filteredBooks.map((b) => (
                <div key={b.id} className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center gap-5">
                  <div className="w-12 h-14 rounded-xl bg-[#002A5C] flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-black text-center leading-tight px-1">{b.course.slice(0, 3)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-black text-sm truncate">{b.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{b.author} · {b.edition} edition · <span className="font-mono">{b.course}</span></p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CONDITION_COLORS[b.condition]}`}>{b.condition}</span>
                      <span className="text-xs text-gray-400">by {b.seller} · {b.posted}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-[#002A5C] text-xl">${b.price}</p>
                    <button className="mt-2 bg-[#002A5C] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-black transition-colors">
                      Contact
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

