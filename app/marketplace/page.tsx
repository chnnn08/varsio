"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getProfile, type Profile } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

type Tutor = {
  id: string; display_name: string; subjects: string[];
  rate: number; bio: string; available: boolean; created_at: string;
};

type Textbook = {
  id: string; title: string; course: string; author: string;
  edition: string; condition: "New" | "Like New" | "Good" | "Fair";
  price: number; seller_name: string; sold: boolean; created_at: string;
};

type Tab = "tutoring" | "textbooks";

const CONDITIONS = ["New", "Like New", "Good", "Fair"] as const;

const CONDITION_COLORS: Record<string, string> = {
  "New": "bg-green-50 text-green-700",
  "Like New": "bg-[#1a8c4e]/10 text-[#1a8c4e]",
  "Good": "bg-blue-50 text-[#002A5C]",
  "Fair": "bg-yellow-50 text-yellow-700",
};

function Stars({ n }: { n: number }) {
  const full = Math.min(5, Math.max(0, Math.floor(n)));
  return <span className="text-[#F0B429]">{"★".repeat(full)}{"☆".repeat(5 - full)}</span>;
}

function fmtTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function MarketplacePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("tutoring");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Tutoring
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [tutorSearch, setTutorSearch] = useState("");
  const [showTutorForm, setShowTutorForm] = useState(false);
  const [tutorForm, setTutorForm] = useState({ subjects: "", rate: "", bio: "" });
  const [submittingTutor, setSubmittingTutor] = useState(false);

  // Textbooks
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [bookSearch, setBookSearch] = useState("");
  const [showBookForm, setShowBookForm] = useState(false);
  const [bookForm, setBookForm] = useState({
    title: "", course: "", author: "", edition: "",
    condition: "Good" as Textbook["condition"], price: "",
  });
  const [submittingBook, setSubmittingBook] = useState(false);

  useEffect(() => {
    async function init() {
      const p = await getProfile();
      setProfile(p);
      await Promise.all([loadTutors(), loadTextbooks()]);
      setLoading(false);
    }
    init();
  }, []);

  async function loadTutors() {
    const { data } = await supabase.from("tutors")
      .select("*").order("created_at", { ascending: false });
    if (data) setTutors(data as Tutor[]);
  }

  async function loadTextbooks() {
    const { data } = await supabase.from("textbooks")
      .select("*").eq("sold", false).order("created_at", { ascending: false });
    if (data) setTextbooks(data as Textbook[]);
  }

  async function listAsTutor() {
    if (!profile || !tutorForm.subjects.trim() || !tutorForm.rate) return;
    setSubmittingTutor(true);
    const subjects = tutorForm.subjects.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    await supabase.from("tutors").insert({
      display_name: profile.displayName,
      subjects,
      rate: parseFloat(tutorForm.rate),
      bio: tutorForm.bio.trim(),
      available: true,
    });
    setTutorForm({ subjects: "", rate: "", bio: "" });
    setShowTutorForm(false);
    await loadTutors();
    setSubmittingTutor(false);
  }

  async function toggleAvailability(tutor: Tutor) {
    if (tutor.display_name.toLowerCase() !== profile?.displayName.toLowerCase()) return;
    await supabase.from("tutors").update({ available: !tutor.available }).eq("id", tutor.id);
    setTutors((prev) => prev.map((t) => t.id === tutor.id ? { ...t, available: !t.available } : t));
  }

  async function listTextbook() {
    if (!profile || !bookForm.title.trim() || !bookForm.price) return;
    setSubmittingBook(true);
    await supabase.from("textbooks").insert({
      title: bookForm.title.trim(),
      course: bookForm.course.trim().toUpperCase(),
      author: bookForm.author.trim(),
      edition: bookForm.edition.trim(),
      condition: bookForm.condition,
      price: parseFloat(bookForm.price),
      seller_name: profile.displayName,
      sold: false,
    });
    setBookForm({ title: "", course: "", author: "", edition: "", condition: "Good", price: "" });
    setShowBookForm(false);
    await loadTextbooks();
    setSubmittingBook(false);
  }

  async function markSold(id: string) {
    await supabase.from("textbooks").update({ sold: true }).eq("id", id);
    setTextbooks((prev) => prev.filter((b) => b.id !== id));
  }

  const filteredTutors = tutors.filter((t) =>
    !tutorSearch ||
    t.subjects.some((s) => s.toLowerCase().includes(tutorSearch.toLowerCase())) ||
    t.display_name.toLowerCase().includes(tutorSearch.toLowerCase())
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
            <p className="text-white/50 text-sm">Find tutors, buy and sell textbooks within the UofT community.</p>
          </div>
          {tab === "tutoring" ? (
            <button onClick={() => { if (!profile) { router.push("/profile"); return; } setShowTutorForm(!showTutorForm); }}
              className="shrink-0 bg-[#F0B429] text-black font-bold px-6 py-3 rounded-xl text-sm hover:bg-yellow-400 transition-colors">
              Become a Tutor
            </button>
          ) : (
            <button onClick={() => { if (!profile) { router.push("/profile"); return; } setShowBookForm(!showBookForm); }}
              className="shrink-0 bg-[#F0B429] text-black font-bold px-6 py-3 rounded-xl text-sm hover:bg-yellow-400 transition-colors">
              List a Textbook
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white border border-gray-100 rounded-2xl p-1.5 w-fit">
          {([["tutoring", "Tutoring"], ["textbooks", "Textbooks"]] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t ? "bg-[#002A5C] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── TUTORING ──────────────────────────────────────────── */}
        {tab === "tutoring" && (
          <div className="space-y-4">
            {/* Become a tutor form */}
            {showTutorForm && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <h2 className="font-black text-black mb-1">Become a Tutor</h2>
                <p className="text-xs text-gray-400 mb-4">Listing as <span className="font-semibold">{profile?.displayName}</span></p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Courses You Tutor</label>
                    <input value={tutorForm.subjects} onChange={(e) => setTutorForm({ ...tutorForm, subjects: e.target.value })}
                      placeholder="e.g. CSC108H1, CSC148H1, MAT137Y1"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                    />
                    <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Hourly Rate (CAD)</label>
                    <input type="number" value={tutorForm.rate} onChange={(e) => setTutorForm({ ...tutorForm, rate: e.target.value })}
                      placeholder="e.g. 25" min="1"
                      className="w-32 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Bio</label>
                    <textarea value={tutorForm.bio} onChange={(e) => setTutorForm({ ...tutorForm, bio: e.target.value })}
                      placeholder="Tell students about your background and teaching style..."
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={listAsTutor} disabled={submittingTutor || !tutorForm.subjects.trim() || !tutorForm.rate}
                      className="flex-1 bg-[#002A5C] text-white font-bold py-3 rounded-xl text-sm hover:bg-black transition-colors disabled:opacity-40">
                      {submittingTutor ? "Listing..." : "List as Tutor →"}
                    </button>
                    <button onClick={() => setShowTutorForm(false)}
                      className="px-5 border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl text-sm hover:border-gray-400 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* No profile prompt */}
            {!profile && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between gap-4">
                <p className="text-sm text-gray-500">Create a profile to list yourself as a tutor.</p>
                <Link href="/profile" className="text-xs font-bold text-[#002A5C] border border-[#002A5C]/20 px-4 py-2 rounded-xl hover:bg-[#002A5C] hover:text-white transition-all shrink-0">
                  Create Profile
                </Link>
              </div>
            )}

            {/* Search */}
            <input value={tutorSearch} onChange={(e) => setTutorSearch(e.target.value)}
              placeholder="Search by course or name (e.g. CSC108H1)..."
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
            />

            {/* Tutor cards */}
            {loading ? (
              <div className="text-center py-12"><div className="w-6 h-6 border-2 border-[#002A5C]/20 border-t-[#002A5C] rounded-full animate-spin mx-auto" /></div>
            ) : filteredTutors.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl text-center py-16 text-gray-300">
                <p className="text-sm font-semibold">No tutors yet — be the first to list</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredTutors.map((t) => {
                  const isMe = t.display_name.toLowerCase() === profile?.displayName.toLowerCase();
                  return (
                    <div key={t.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Link href={`/profile/${encodeURIComponent(t.display_name)}`}
                            className="w-11 h-11 rounded-xl bg-[#002A5C] text-white font-black flex items-center justify-center text-sm shrink-0 hover:opacity-80 transition-opacity">
                            {t.display_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </Link>
                          <div>
                            <Link href={`/profile/${encodeURIComponent(t.display_name)}`}
                              className="font-bold text-black text-sm hover:text-[#002A5C] transition-colors">
                              {t.display_name}
                            </Link>
                            <p className="text-xs text-gray-400 mt-0.5">{fmtTime(t.created_at)}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-[#002A5C] text-lg">${t.rate}</p>
                          <p className="text-xs text-gray-400">/hr</p>
                        </div>
                      </div>
                      {t.bio && <p className="text-xs text-gray-500 leading-relaxed mb-3">{t.bio}</p>}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {t.subjects.map((s) => (
                          <span key={s} className="bg-[#002A5C]/8 text-[#002A5C] text-xs font-bold px-2.5 py-1 rounded-lg font-mono">{s}</span>
                        ))}
                      </div>
                      {isMe ? (
                        <button onClick={() => toggleAvailability(t)}
                          className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
                            t.available ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-[#1a8c4e] text-white hover:bg-green-700"
                          }`}>
                          {t.available ? "Mark Unavailable" : "Mark Available"}
                        </button>
                      ) : t.available && profile ? (
                        <button onClick={() => router.push(`/chat?tab=dm&with=${encodeURIComponent(t.display_name)}`)}
                          className="w-full py-2.5 rounded-xl text-sm font-bold bg-[#1a8c4e] text-white hover:bg-green-700 transition-colors">
                          Book Session
                        </button>
                      ) : !profile ? (
                        <Link href="/profile" className="block w-full py-2.5 rounded-xl text-sm font-bold text-center bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                          Sign in to book
                        </Link>
                      ) : (
                        <div className="w-full py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-400 text-center">
                          Unavailable
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TEXTBOOKS ─────────────────────────────────────────── */}
        {tab === "textbooks" && (
          <div className="space-y-4">
            {/* List form */}
            {showBookForm && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <h2 className="font-black text-black mb-4">List a Textbook</h2>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                    placeholder="Book title"
                    className="col-span-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                  />
                  <input value={bookForm.course} onChange={(e) => setBookForm({ ...bookForm, course: e.target.value.toUpperCase() })}
                    placeholder="Course (e.g. MAT137Y1)"
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                  />
                  <input value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                    placeholder="Author"
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                  />
                  <input value={bookForm.edition} onChange={(e) => setBookForm({ ...bookForm, edition: e.target.value })}
                    placeholder="Edition (e.g. 3rd)"
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                  />
                  <input type="number" value={bookForm.price} onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })}
                    placeholder="Price (CAD)" min="1"
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                  />
                </div>
                <div className="flex gap-2 mb-4">
                  {CONDITIONS.map((c) => (
                    <button key={c} type="button" onClick={() => setBookForm({ ...bookForm, condition: c })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        bookForm.condition === c ? "bg-[#002A5C] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={listTextbook} disabled={submittingBook || !bookForm.title.trim() || !bookForm.price}
                    className="flex-1 bg-[#002A5C] text-white font-bold py-3 rounded-xl text-sm hover:bg-black transition-colors disabled:opacity-40">
                    {submittingBook ? "Listing..." : "List Textbook →"}
                  </button>
                  <button onClick={() => setShowBookForm(false)}
                    className="px-5 border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl text-sm hover:border-gray-400 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* No profile prompt */}
            {!profile && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between gap-4">
                <p className="text-sm text-gray-500">Create a profile to list textbooks for sale.</p>
                <Link href="/profile" className="text-xs font-bold text-[#002A5C] border border-[#002A5C]/20 px-4 py-2 rounded-xl hover:bg-[#002A5C] hover:text-white transition-all shrink-0">
                  Create Profile
                </Link>
              </div>
            )}

            {/* Search */}
            <input value={bookSearch} onChange={(e) => setBookSearch(e.target.value)}
              placeholder="Search by title or course code..."
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
            />

            {/* Listings */}
            {loading ? (
              <div className="text-center py-12"><div className="w-6 h-6 border-2 border-[#002A5C]/20 border-t-[#002A5C] rounded-full animate-spin mx-auto" /></div>
            ) : filteredBooks.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl text-center py-16 text-gray-300">
                <p className="text-sm font-semibold">No textbooks listed yet — sell yours</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBooks.map((b) => {
                  const isMe = b.seller_name.toLowerCase() === profile?.displayName.toLowerCase();
                  return (
                    <div key={b.id} className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center gap-5">
                      <div className="w-12 h-14 rounded-xl bg-[#002A5C] flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-black text-center leading-tight px-1">{(b.course || "BK").slice(0, 3)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-black text-sm truncate">{b.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {b.author && `${b.author} · `}{b.edition && `${b.edition} edition · `}
                          {b.course && <span className="font-mono">{b.course}</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CONDITION_COLORS[b.condition]}`}>{b.condition}</span>
                          <span className="text-xs text-gray-400">
                            by{" "}
                            <Link href={`/profile/${encodeURIComponent(b.seller_name)}`} className="font-semibold hover:underline">
                              {b.seller_name}
                            </Link>
                            {" · "}{fmtTime(b.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-[#002A5C] text-xl">${b.price}</p>
                        {isMe ? (
                          <button onClick={() => markSold(b.id)}
                            className="mt-2 border border-gray-200 text-gray-500 text-xs font-bold px-4 py-2 rounded-xl hover:border-red-300 hover:text-red-500 transition-colors block">
                            Mark Sold
                          </button>
                        ) : profile ? (
                          <button onClick={() => router.push(`/chat?tab=dm&with=${encodeURIComponent(b.seller_name)}`)}
                            className="mt-2 bg-[#002A5C] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-black transition-colors block">
                            Contact
                          </button>
                        ) : (
                          <Link href="/profile"
                            className="mt-2 bg-gray-100 text-gray-500 text-xs font-bold px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors block text-center">
                            Sign in
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
