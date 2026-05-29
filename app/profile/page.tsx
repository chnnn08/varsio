"use client";

import { useEffect, useState } from "react";
import { getProfile, saveProfile, clearProfile, type Profile } from "@/lib/profile";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate", "Alumni"];

const PROGRAMS = {
  "St. George (UTSG)": [
    "Computer Science", "Mathematics", "Statistics", "Physics", "Chemistry",
    "Biology", "Biochemistry", "Neuroscience", "Cognitive Science", "Psychology",
    "Economics", "Commerce", "Finance", "Accounting",
    "Engineering Science", "Electrical Engineering", "Computer Engineering",
    "Mechanical Engineering", "Civil Engineering", "Chemical Engineering",
    "English", "History", "Political Science", "Sociology", "Philosophy",
    "Anthropology", "Linguistics", "Geography", "Global Affairs",
    "International Relations", "Architecture", "Music", "Art History",
    "Cinema Studies", "Astronomy", "Earth Sciences", "Environmental Science",
    "Kinesiology", "Nursing", "Pharmacy", "Medicine", "Law", "Social Work",
  ],
  "UTM": [
    "Computer Science", "Mathematical Sciences", "Biology", "Chemistry",
    "Physics", "Biochemistry", "Psychology", "Economics", "Management",
    "Accounting", "Finance", "Communication, Culture & IT (CCIT)",
    "Visual Studies", "English", "Sociology", "Forensic Science",
    "Geographic Information Science",
  ],
  "UTSC": [
    "Computer Science", "Mathematics & Statistics", "Management", "Psychology",
    "Sociology", "Biology", "Chemistry", "Physics", "English",
    "Political Science", "History", "Environmental Science",
    "International Development", "Human Geography", "Education",
  ],
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ displayName: "", year: "", program: "", bio: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = getProfile();
    if (p) { setProfile(p); setForm(p); }
    else setEditing(true);
  }, []);

  function handleSave() {
    if (!form.displayName.trim()) return;
    const p: Profile = {
      id: profile?.id ?? crypto.randomUUID(),
      displayName: form.displayName.trim(),
      year: form.year,
      program: form.program,
      bio: form.bio.trim(),
    };
    saveProfile(p);
    setProfile(p);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleDelete() {
    clearProfile();
    setProfile(null);
    setForm({ displayName: "", year: "", program: "", bio: "" });
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
          {/* Avatar preview */}
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
              <p className="text-xs text-gray-400 mt-1.5">Keep it appropriate — this is visible to other students.</p>
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

            {/* Program — grouped by campus */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Program</label>
              <select
                value={form.program}
                onChange={(e) => setForm({ ...form, program: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C] bg-white"
              >
                <option value="">Select your program</option>
                {Object.entries(PROGRAMS).map(([campus, programs]) => (
                  <optgroup key={campus} label={`── ${campus} ──`}>
                    {programs.map((p) => (
                      <option key={p} value={`${p} (${campus})`}>{p}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {form.program && (
                <p className="text-xs text-[#002A5C] font-semibold mt-1.5">Selected: {form.program}</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Bio <span className="text-gray-300 normal-case font-normal">(optional)</span>
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="e.g. CS + Stats double major · looking for study partners for MAT237"
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
                {profile ? "Save Changes" : "Create Profile →"}
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
          {(profile.year || profile.program) && (
            <p className="text-white/50 mt-2">{[profile.year, profile.program].filter(Boolean).join(" · ")}</p>
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
            Your display name is visible across all chats and study sessions. Keep it respectful — accounts that misuse the platform can be reported.
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
