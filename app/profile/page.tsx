"use client";

import { useEffect, useRef, useState, type CSSProperties, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getProfile, saveProfile, clearProfile, registerPublicProfile, type Profile } from "@/lib/profile";

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
  });
  const [saved, setSaved] = useState(false);
  const [openCampus, setOpenCampus] = useState<string | null>("St. George (UTSG)");
  const [connInput, setConnInput] = useState("");
  const [connError, setConnError] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const p = getProfile();
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
      });
      registerPublicProfile(p);
    } else {
      setEditing(true);
    }
  }, []);

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

  function toggleProgram(prog: string) {
    setForm((f) => ({
      ...f,
      programs: f.programs.includes(prog) ? f.programs.filter((p) => p !== prog) : [...f.programs, prog],
    }));
  }

  function handleSave() {
    if (!form.displayName.trim()) return;
    const isNew = !profile;
    const p: Profile = {
      id: profile?.id ?? crypto.randomUUID(),
      displayName: form.displayName.trim(),
      year: form.year,
      programs: form.programs,
      bio: form.bio.trim(),
      avatar: form.avatar,
      avatarImage: form.avatarImage,
      coverColor: form.coverColor,
      connections: profile?.connections ?? [],
    };
    saveProfile(p);
    setProfile(p);
    setEditing(false);
    if (isNew) {
      router.push("/match?welcome=1");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  function handleDelete() {
    clearProfile();
    setProfile(null);
    setForm({ displayName: "", year: "", programs: [], bio: "", avatar: "#002A5C", avatarImage: undefined, coverColor: "#002A5C" });
    setEditing(true);
  }

  function addConnection() {
    const name = connInput.trim();
    if (!name || !profile) return;
    if (name.toLowerCase() === profile.displayName.toLowerCase()) { setConnError("That's you."); return; }
    if (profile.connections.includes(name)) { setConnError("Already connected."); return; }
    const updated: Profile = { ...profile, connections: [...profile.connections, name] };
    saveProfile(updated);
    setProfile(updated);
    setConnInput("");
    setConnError("");
  }

  function removeConnection(name: string) {
    if (!profile) return;
    const updated: Profile = { ...profile, connections: profile.connections.filter((c) => c !== name) };
    saveProfile(updated);
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
          <div className="h-32 transition-colors duration-200" style={{ backgroundColor: form.coverColor }} />
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
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Cover Color
                </label>
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
    <div>
      {/* Cover banner — extends behind navbar for full-bleed effect */}
      <div
        className="h-48"
        style={{ backgroundColor: profile.coverColor ?? "#002A5C" }}
      />

      <div className="max-w-lg mx-auto px-6 pb-16">
        {/* Avatar overlapping cover */}
        <div className="-mt-10 mb-3">
          <ProfilePhoto
            name={profile.displayName}
            avatar={profile.avatar ?? "#002A5C"}
            avatarImage={profile.avatarImage}
            size={84}
            border
          />
        </div>

        {/* Name + year */}
        <h1 className="text-2xl font-black text-black leading-tight">{profile.displayName}</h1>
        {profile.year && (
          <p className="text-sm text-gray-500 mt-0.5">{profile.year}</p>
        )}

        {saved && <p className="text-green-600 text-xs font-semibold mt-2">Profile saved.</p>}

        <div className="mt-5 space-y-4">

          {/* About card */}
          {(profile.bio || programs.length > 0) && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">About</p>
              {profile.bio && (
                <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
              )}
              {profile.bio && programs.length > 0 && (
                <div className="border-t border-gray-100 my-4" />
              )}
              {programs.length > 0 && (
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
              )}
            </div>
          )}

          {/* Connections */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Connections ({profile.connections.length})
            </p>

            <div className="flex gap-2 mb-3">
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
              <p className="text-xs text-gray-300 text-center py-3">
                No connections yet. Visit someone&apos;s profile to connect, or add by name above.
              </p>
            ) : (
              <div className="space-y-2">
                {profile.connections.map((name) => (
                  <div key={name} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-gray-50 rounded-xl">
                    <Link
                      href={`/profile/${encodeURIComponent(name)}`}
                      className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#002A5C] text-white text-xs font-black flex items-center justify-center shrink-0">
                        {name[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-black truncate">{name}</span>
                    </Link>
                    <button
                      onClick={() => removeConnection(name)}
                      className="text-xs text-gray-300 hover:text-red-400 transition-colors font-semibold shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Share profile */}
          <div className="bg-[#002A5C]/5 border border-[#002A5C]/10 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#002A5C] mb-0.5">Your public profile</p>
              <p className="text-xs text-gray-400 font-mono truncate">
                varsio.vercel.app/profile/{profile.displayName}
              </p>
            </div>
            <button
              onClick={copyProfileLink}
              className={`text-xs font-bold px-4 py-2 rounded-xl shrink-0 transition-all ${
                linkCopied ? "bg-[#1a8c4e] text-white" : "bg-[#002A5C] text-white hover:bg-black"
              }`}
            >
              {linkCopied ? "Copied!" : "Share"}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setEditing(true)}
              className="flex-1 bg-[#002A5C] text-white font-bold py-3 rounded-xl text-sm hover:bg-black transition-colors"
            >
              Edit Profile
            </button>
            <button
              onClick={handleDelete}
              className="px-5 border border-red-200 text-red-400 font-semibold py-3 rounded-xl text-sm hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
