"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile, saveProfile, clearProfile, type Profile } from "@/lib/profile";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Graduate", "Alumni"];

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

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ displayName: "", year: "", programs: [] as string[], bio: "" });
  const [saved, setSaved] = useState(false);
  const [openCampus, setOpenCampus] = useState<string | null>("St. George (UTSG)");
  const router = useRouter();
  const isNewProfile = !profile;

  useEffect(() => {
    const p = getProfile();
    if (p) { setProfile(p); setForm({ ...p, programs: p.programs ?? [] }); }
    else setEditing(true);
  }, []);

  function toggleProgram(prog: string) {
    setForm((f) => ({
      ...f,
      programs: f.programs.includes(prog)
        ? f.programs.filter((p) => p !== prog)
        : [...f.programs, prog],
    }));
  }

  function handleSave() {
    if (!form.displayName.trim()) return;
    const p: Profile = {
      id: profile?.id ?? crypto.randomUUID(),
      displayName: form.displayName.trim(),
      year: form.year,
      programs: form.programs,
      bio: form.bio.trim(),
    };
    const isNew = !profile;
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
    setForm({ displayName: "", year: "", programs: [], bio: "" });
    setEditing(true);
  }

  if (editing) {
    return (
      <div>
        <div className="bg-[#002A5C] text-white pt-14 pb-16 px-4 sm:px-6">
          <div className="max-w-lg mx-auto">
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Profile</p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">
              {profile ? "Edit Profile" : "Create Your Profile"}
            </h1>
            <p className="text-white/50">Your display name appears in chat and study sessions.</p>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-6 py-10">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-[#002A5C] text-white flex items-center justify-center text-2xl font-black">
              {form.displayName ? initials(form.displayName) : "?"}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">

            {/* Display name */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Display Name <span className="text-red-400">*</span>
              </label>
              <input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="e.g. Alex or alexcodes"
                maxLength={30}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
              />
              <p className="text-xs text-gray-400 mt-1.5">Keep it appropriate - this is visible to other students.</p>
            </div>

            {/* Year */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Year</label>
              <div className="flex flex-wrap gap-2">
                {YEARS.map((y) => (
                  <button
                    key={y}
                    onClick={() => setForm({ ...form, year: y })}
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

            {/* Programs - multi select */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Program <span className="text-gray-300 normal-case font-normal">(select all that apply)</span>
              </label>

              {/* Selected tags */}
              {form.programs.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.programs.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1.5 bg-[#002A5C] text-white text-xs font-semibold px-3 py-1.5 rounded-full"
                    >
                      {p}
                      <button onClick={() => toggleProgram(p)} className="hover:text-white/60 transition-colors">&times;</button>
                    </span>
                  ))}
                </div>
              )}

              {/* Campus sections */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {Object.entries(PROGRAMS).map(([campus, programs], i) => (
                  <div key={campus} className={i > 0 ? "border-t border-gray-200" : ""}>
                    <button
                      onClick={() => setOpenCampus(openCampus === campus ? null : campus)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span>{campus}</span>
                      <span className="text-gray-400 text-xs">
                        {form.programs.filter((p) => programs.includes(p)).length > 0 && (
                          <span className="bg-[#002A5C] text-white rounded-full px-2 py-0.5 mr-2">
                            {form.programs.filter((p) => programs.includes(p)).length}
                          </span>
                        )}
                        {openCampus === campus ? "▲" : "▼"}
                      </span>
                    </button>
                    {openCampus === campus && (
                      <div className="px-4 pb-4 flex flex-wrap gap-2">
                        {programs.map((prog) => (
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

            {/* Bio */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Bio <span className="text-gray-300 normal-case font-normal">(optional)</span>
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="e.g. CS + Stats double major, looking for study partners for MAT237"
                rows={3}
                maxLength={150}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
              />
              <p className="text-xs text-gray-400 mt-1">{form.bio.length}/150</p>
            </div>

            <div className="flex gap-3">
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
    );
  }

  if (!profile) return null;

  return (
    <div>
      <div className="bg-[#002A5C] text-white pt-14 pb-16 px-4 sm:px-6">
        <div className="max-w-lg mx-auto">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Profile</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">{profile.displayName}</h1>
          {(profile.year || (profile.programs && profile.programs.length > 0)) && (
            <p className="text-white/50 mt-2">
              {[profile.year, ...(profile.programs ?? [])].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center mb-4">
          <div className="w-20 h-20 rounded-2xl bg-[#002A5C] text-white flex items-center justify-center text-2xl font-black mx-auto mb-4">
            {initials(profile.displayName)}
          </div>
          {profile.bio && (
            <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">{profile.bio}</p>
          )}
          {saved && <p className="text-green-600 text-xs font-semibold mt-4">Profile saved</p>}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
          <p className="text-xs font-bold text-amber-800 mb-1">Community Guidelines</p>
          <p className="text-amber-700 text-xs leading-relaxed">
            Your display name is visible across all chats and study sessions. Keep it respectful - accounts that misuse the platform can be reported.
          </p>
        </div>

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
  );
}
