"use client";

import { useEffect, useRef, useState, type CSSProperties, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getProfile, saveProfile, clearProfile, type Profile } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { track } from "@vercel/analytics";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Graduate", "Alumni"];

const COVER_COLORS = [
  "#002A5C", "#0f172a", "#1e40af", "#1a8c4e",
  "#7c3aed", "#be185d", "#dc2626", "#92400e",
  "#0891b2", "#374151",
];

const AVATAR_COLORS = [
  "#002A5C", "#1a8c4e", "#7c3aed", "#dc2626",
  "#0891b2", "#be185d", "#92400e", "#374151",
];

const PROGRAMS: Record<string, string[]> = {
  "St. George (UTSG)": [
    "Accounting", "Anthropology", "Architecture", "Art History",
    "Astronomy", "Biochemistry", "Biology", "Chemistry",
    "Chemical Engineering", "Cinema Studies", "Civil Engineering",
    "Cognitive Science", "Commerce", "Computer Engineering",
    "Computer Science", "Criminology", "Earth Sciences",
    "East Asian Studies", "Economics", "Electrical Engineering",
    "Engineering Science", "English", "Environmental Science",
    "Ethics", "Finance", "French", "Geography", "German",
    "Global Affairs", "History", "Human Biology",
    "Immunology", "Industrial Engineering", "International Relations",
    "Italian", "Jewish Studies", "Kinesiology", "Law",
    "Linguistics", "Materials Science Engineering", "Mathematics",
    "Mechanical Engineering", "Medicine", "Molecular Biology",
    "Music", "Near & Middle Eastern Civilizations", "Neuroscience",
    "Nursing", "Nutritional Sciences", "Pharmacy", "Philosophy",
    "Physics", "Political Science", "Psychology", "Religion",
    "Social Work", "Sociology", "Spanish", "Statistics",
    "Urban Studies",
  ],
  "Mississauga (UTM)": [
    "Accounting", "Anthropology", "Applied Statistics",
    "Art History", "Biochemistry", "Biology", "Chemistry",
    "Communication, Culture & IT (CCIT)", "Computer Science",
    "Economics", "English", "Environmental Science",
    "Finance", "Forensic Science", "French & Linguistics",
    "Geographic Information Science", "History", "Human Geography",
    "Language Studies", "Management", "Mathematical Sciences",
    "Neuroscience", "Philosophy", "Physics",
    "Political Science", "Psychology", "Religion, Ethics & Society",
    "Sociology", "Theatre & Drama Studies", "Visual Studies",
  ],
  "Scarborough (UTSC)": [
    "Anthropology", "Applied Chemistry & Materials Science",
    "Arts Management", "Biology", "Chemistry",
    "Computer Engineering Technology", "Computer Science",
    "Education", "Electrical Engineering Technology",
    "English", "Environmental Science", "French",
    "Health Studies", "History", "Human Geography",
    "Integrative Biology", "International Development",
    "Linguistics", "Management", "Mathematics & Statistics",
    "Mechanical & Industrial Engineering Technology",
    "Neuroscience", "Paramedicine", "Philosophy",
    "Physical & Environmental Geography", "Physics",
    "Political Science", "Psychology", "Sociology",
    "Women & Gender Studies",
  ],
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function ProfilePhoto({
  name, avatar, avatarImage, size = 80, border = false,
}: {
  name: string; avatar: string; avatarImage?: string; size?: number; border?: boolean;
}) {
  const shared: CSSProperties = {
    width: size, height: size, borderRadius: "50%",
    border: border ? "4px solid white" : "none",
    flexShrink: 0,
  };
  if (avatarImage) {
    return <img src={avatarImage} alt={name} style={{ ...shared, objectFit: "cover" }} />;
  }
  const fontSize = size >= 64 ? 22 : size >= 36 ? 13 : 10;
  return (
    <div
      style={{ ...shared, backgroundColor: avatar, fontSize }}
      className="text-white font-black flex items-center justify-center"
    >
      {initials(name || "?")}
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    year: "",
    programs: [] as string[],
    bio: "",
    avatar: "#002A5C",
    avatarImage: undefined as string | undefined,
    coverColor: "#002A5C",
    coverImage: undefined as string | undefined,
  });
  const [saved, setSaved] = useState(false);
  const [openCampus, setOpenCampus] = useState<string | null>("St. George (UTSG)");
  const [connInput, setConnInput] = useState("");
  const [connError, setConnError] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const p = await getProfile();
      if (p) {
        setProfile(p);
        setForm({
          displayName: p.displayName,
          year: p.year,
          programs: p.programs ?? [],
          bio: p.bio,
          avatar: p.avatar ?? "#002A5C",
          avatarImage: p.avatarImage,
          coverColor: p.coverColor ?? "#002A5C",
          coverImage: p.coverImage,
        });
      } else {
        setEditing(true);
      }
    }
    init();
  }, [router]);

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext("2d")!;
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, 200, 200);
        setForm((f) => ({ ...f, avatarImage: canvas.toDataURL("image/jpeg", 0.85) }));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

  function handleCoverChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 400;
        const ctx = canvas.getContext("2d")!;
        const targetRatio = 1200 / 400;
        const srcRatio = img.width / img.height;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (srcRatio > targetRatio) {
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / targetRatio;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 1200, 400);
        setForm((f) => ({ ...f, coverImage: canvas.toDataURL("image/jpeg", 0.8) }));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

  function toggleProgram(prog: string) {
    setForm((f) => ({
      ...f,
      programs: f.programs.includes(prog) ? f.programs.filter((p) => p !== prog) : [...f.programs, prog],
    }));
  }

  async function handleSave() {
    if (!form.displayName.trim()) return;
    const isNew = !profile;
    const { data: { user } } = await supabase.auth.getUser();
    const p: Profile = {
      id: user?.id ?? profile?.id ?? "",
      displayName: form.displayName.trim(),
      year: form.year,
      programs: form.programs,
      bio: form.bio.trim(),
      avatar: form.avatar,
      avatarImage: form.avatarImage,
      coverColor: form.coverColor,
      coverImage: form.coverImage,
      connections: profile?.connections ?? [],
    };
    await saveProfile(p);
    setProfile(p);
    setEditing(false);
    if (isNew) {
      track("profile_created", { year: p.year, programs: p.programs.length });
      router.push("/match?welcome=1");
    } else {
      track("profile_updated");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  async function handleDelete() {
    await clearProfile();
    setProfile(null);
    setForm({ displayName: "", year: "", programs: [], bio: "", avatar: "#002A5C", avatarImage: undefined, coverColor: "#002A5C", coverImage: undefined });
    setEditing(true);
  }

  async function addConnection() {
    const name = connInput.trim();
    if (!name || !profile) return;
    if (name.toLowerCase() === profile.displayName.toLowerCase()) { setConnError("That's you."); return; }
    if (profile.connections.includes(name)) { setConnError("Already connected."); return; }
    const updated: Profile = { ...profile, connections: [...profile.connections, name] };
    await saveProfile(updated);
    setProfile(updated);
    setConnInput("");
    setConnError("");
  }

  async function removeConnection(name: string) {
    if (!profile) return;
    const updated: Profile = { ...profile, connections: profile.connections.filter((c) => c !== name) };
    await saveProfile(updated);
    setProfile(updated);
  }

  function copyProfileLink() {
    if (!profile) return;
    navigator.clipboard.writeText(`${window.location.origin}/profile/${encodeURIComponent(profile.displayName)}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  // ---------------------------------------------------------------------------
  // EDIT MODE
  // ---------------------------------------------------------------------------
  if (editing) {
    return (
      <div>
        {/* Cover preview strip */}
        <div className="pt-14">
          <div
            className="h-32 relative group cursor-pointer"
            style={{
              backgroundColor: form.coverColor,
              backgroundImage: form.coverImage ? `url(${form.coverImage})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            onClick={() => coverFileRef.current?.click()}
          >
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 bg-white/90 text-[#002A5C] text-xs font-bold px-4 py-2 rounded-xl">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {form.coverImage ? "Change cover" : "Upload cover photo"}
              </div>
            </div>
          </div>
          <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
        </div>

        <div className="max-w-lg mx-auto px-6">
          {/* Avatar upload row */}
          <div className="flex items-end gap-4 -mt-10 mb-6">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            <div
              className="relative cursor-pointer group"
              onClick={() => fileRef.current?.click()}
            >
              <ProfilePhoto
                name={form.displayName || "?"}
                avatar={form.avatar}
                avatarImage={form.avatarImage}
                size={80}
                border
              />
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            </div>
            <div className="pb-1">
              <button
                onClick={() => fileRef.current?.click()}
                className="text-sm font-semibold text-[#002A5C] hover:underline block"
              >
                {form.avatarImage ? "Change photo" : "Upload photo"}
              </button>
              {form.avatarImage && (
                <button
                  onClick={() => setForm((f) => ({ ...f, avatarImage: undefined }))}
                  className="text-xs text-red-400 hover:underline mt-0.5 block"
                >
                  Remove
                </button>
              )}
              <p className="text-xs text-gray-400 mt-0.5">Cropped to square, JPEG</p>
            </div>
          </div>

          <div className="space-y-4 pb-16">
            {/* Color pickers */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Cover {form.coverImage ? "Photo" : "Color"}
                  </label>
                  {form.coverImage && (
                    <button
                      onClick={() => setForm((f) => ({ ...f, coverImage: undefined }))}
                      className="text-xs text-red-400 hover:underline font-semibold"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
                {!form.coverImage && (
                  <div className="flex gap-2 flex-wrap">
                    {COVER_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setForm((f) => ({ ...f, coverColor: c }))}
                        style={{
                          backgroundColor: c,
                          outline: form.coverColor === c ? "3px solid #111" : "none",
                          outlineOffset: "2px",
                          opacity: form.coverColor === c ? 1 : 0.65,
                        }}
                        className="w-8 h-8 rounded-xl hover:opacity-100 transition-all"
                      />
                    ))}
                  </div>
                )}
                {form.coverImage && (
                  <p className="text-xs text-gray-400">Click the cover above to change it.</p>
                )}
              </div>

              {!form.avatarImage && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Avatar Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setForm((f) => ({ ...f, avatar: c }))}
                        style={{
                          backgroundColor: c,
                          outline: form.avatar === c ? "3px solid #111" : "none",
                          outlineOffset: "2px",
                          opacity: form.avatar === c ? 1 : 0.65,
                        }}
                        className="w-8 h-8 rounded-xl hover:opacity-100 transition-all"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main form fields */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-5">

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Display Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  placeholder="e.g. Alex Chen"
                  maxLength={30}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                />
                <p className="text-xs text-gray-400 mt-1.5">Visible across all chats and study sessions.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Year</label>
                <div className="flex flex-wrap gap-2">
                  {YEARS.map((y) => (
                    <button
                      key={y}
                      onClick={() => setForm((f) => ({ ...f, year: y }))}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                        form.year === y
                          ? "bg-[#002A5C] text-white border-[#002A5C]"
                          : "bg-white text-gray-500 border-gray-200 hover:border-[#002A5C]"
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Program{" "}
                  <span className="text-gray-300 normal-case font-normal">(select all that apply)</span>
                </label>
                {form.programs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {form.programs.map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center gap-1.5 bg-[#002A5C] text-white text-xs font-semibold px-3 py-1.5 rounded-full"
                      >
                        {p}
                        <button onClick={() => toggleProgram(p)} className="hover:text-white/60">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {Object.entries(PROGRAMS).map(([campus, progs], i) => (
                    <div key={campus} className={i > 0 ? "border-t border-gray-200" : ""}>
                      <button
                        onClick={() => setOpenCampus(openCampus === campus ? null : campus)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span>{campus}</span>
                        <span className="flex items-center gap-2 text-gray-400 text-xs">
                          {form.programs.filter((p) => progs.includes(p)).length > 0 && (
                            <span className="bg-[#002A5C] text-white rounded-full px-2 py-0.5 text-xs">
                              {form.programs.filter((p) => progs.includes(p)).length}
                            </span>
                          )}
                          {openCampus === campus ? "^" : "v"}
                        </span>
                      </button>
                      {openCampus === campus && (
                        <div className="px-4 pb-4 flex flex-wrap gap-2">
                          {progs.map((prog) => (
                            <button
                              key={prog}
                              onClick={() => toggleProgram(prog)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                form.programs.includes(prog)
                                  ? "bg-[#002A5C] text-white border-[#002A5C]"
                                  : "bg-white text-gray-500 border-gray-200 hover:border-[#002A5C]"
                              }`}
                            >
                              {prog}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Bio{" "}
                  <span className="text-gray-300 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="e.g. CS + Stats double major, looking for study partners for MAT237"
                  rows={3}
                  maxLength={200}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                />
                <p className="text-xs text-gray-400 mt-1">{form.bio.length}/200</p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleSave}
                  disabled={!form.displayName.trim()}
                  className="flex-1 bg-[#002A5C] text-white font-bold py-3 rounded-xl text-sm hover:bg-black transition-colors disabled:opacity-40"
                >
                  {profile ? "Save Changes" : "Create Profile"}
                </button>
                {profile && (
                  <button
                    onClick={() => setEditing(false)}
                    className="px-5 border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl text-sm hover:border-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const programs = profile.programs ?? [];

  // ---------------------------------------------------------------------------
  // VIEW MODE
  // ---------------------------------------------------------------------------
  return (
    <div className="bg-[#F4F6F9] min-h-screen pb-16">

      {/* Saved toast */}
      {saved && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1a8c4e] text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-lg">
          Profile saved
        </div>
      )}

      {/* Cover banner */}
      <div
        className="h-52 w-full"
        style={{
          backgroundColor: profile.coverColor ?? "#002A5C",
          backgroundImage: profile.coverImage ? `url(${profile.coverImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="max-w-2xl mx-auto px-4 -mt-10 space-y-3">

        {/* ── MAIN PROFILE CARD ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 pb-6">

            {/* Avatar + action buttons row */}
            <div className="flex items-end justify-between -mt-10 mb-4">
              <ProfilePhoto
                name={profile.displayName}
                avatar={profile.avatar ?? "#002A5C"}
                avatarImage={profile.avatarImage}
                size={96}
                border
              />
              <div className="flex gap-2 pb-1">
                <button
                  onClick={copyProfileLink}
                  className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all ${
                    linkCopied
                      ? "bg-[#1a8c4e] text-white border-[#1a8c4e]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#002A5C] hover:text-[#002A5C]"
                  }`}
                >
                  {linkCopied ? "Copied!" : "Share"}
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs font-bold px-4 py-2 rounded-xl bg-[#002A5C] text-white hover:bg-black transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Name */}
            <h1 className="text-2xl font-black text-black leading-tight">{profile.displayName}</h1>

            {/* Year + programs inline */}
            {(profile.year || programs.length > 0) && (
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                {profile.year}
                {profile.year && programs.length > 0 && " · "}
                {programs.slice(0, 3).join(" · ")}
                {programs.length > 3 && ` · +${programs.length - 3} more`}
              </p>
            )}

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">{profile.bio}</p>
            )}

            {/* Connections stat */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm">
                <span className="font-black text-[#002A5C]">{profile.connections.length}</span>
                <span className="text-gray-400 ml-1">
                  {profile.connections.length === 1 ? "connection" : "connections"}
                </span>
              </p>
              <button
                onClick={handleDelete}
                className="text-xs text-gray-300 hover:text-red-400 transition-colors"
              >
                Delete account
              </button>
            </div>
          </div>
        </div>

        {/* ── PROGRAMS CARD ─────────────────────────────────────── */}
        {programs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5">
            <h3 className="text-sm font-black text-black mb-3">Programs</h3>
            <div className="flex flex-wrap gap-2">
              {programs.map((prog) => (
                <span
                  key={prog}
                  className="bg-[#002A5C]/8 text-[#002A5C] text-xs font-semibold px-3 py-1.5 rounded-full"
                >
                  {prog}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── CONNECTIONS CARD ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5">
          <h3 className="text-sm font-black text-black mb-4">Connections</h3>

          <div className="flex gap-2 mb-4">
            <input
              value={connInput}
              onChange={(e) => { setConnInput(e.target.value); setConnError(""); }}
              onKeyDown={(e) => e.key === "Enter" && addConnection()}
              placeholder="Add by display name..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
            />
            <button
              onClick={addConnection}
              className="bg-[#002A5C] text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-black transition-colors shrink-0"
            >
              Add
            </button>
          </div>
          {connError && <p className="text-red-500 text-xs mb-3 font-medium">{connError}</p>}

          {profile.connections.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm font-semibold text-gray-400 mb-1">No connections yet</p>
              <p className="text-xs text-gray-300">Visit someone&apos;s profile to connect, or add by name above.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {profile.connections.map((name) => (
                <div key={name} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <Link
                    href={`/profile/${encodeURIComponent(name)}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#002A5C] text-white text-xs font-black flex items-center justify-center shrink-0">
                      {name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-black truncate">{name}</p>
                      <p className="text-xs text-gray-400">Varsio</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => removeConnection(name)}
                    className="text-xs text-gray-300 hover:text-red-400 transition-colors font-semibold shrink-0 px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── PUBLIC PROFILE LINK ───────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-500 mb-0.5">Public profile link</p>
            <p className="text-xs text-gray-400 font-mono truncate">
              varsio.vercel.app/profile/{profile.displayName}
            </p>
          </div>
          <button
            onClick={copyProfileLink}
            className={`text-xs font-bold px-4 py-2 rounded-xl shrink-0 transition-all ${
              linkCopied ? "bg-[#1a8c4e] text-white" : "border border-gray-200 text-gray-600 hover:border-[#002A5C] hover:text-[#002A5C]"
            }`}
          >
            {linkCopied ? "Copied!" : "Copy link"}
          </button>
        </div>

      </div>
    </div>
  );
}
