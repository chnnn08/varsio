"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createWorker } from "tesseract.js";

// -- types --------------------------------------------------------------------
type InputMethod = "manual" | "screenshot";
type Step = "landing" | "setup" | "room";
type Member = { name: string; courses: CourseEntry[] };
type Room = { code: string; members: Member[] };
type CourseEntry = { code: string; section: string };

// -- shared room store (in-memory for demo) -----------------------------------
const ROOMS: Record<string, Room> = {};

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Extract UofT-style course codes from OCR text
function extractCourses(text: string): CourseEntry[] {
  const codePattern = /\b([A-Z]{2,4}\d{3}[HY]\d)\b/g;
  const sectionPattern = /\b(LEC|TUT|PRA|LAB)\s*(\d{4})\b/gi;
  const codes = [...new Set(text.match(codePattern) ?? [])];
  const sections = [...text.matchAll(sectionPattern)].map(
    (m) => `${m[1].toUpperCase()}${m[2]}`
  );
  return codes.map((code, i) => ({ code, section: sections[i] ?? "" }));
}

function getOverlap(members: Member[]): string[] {
  if (members.length < 2) return [];
  const sets = members.map((m) => new Set(m.courses.map((c) => c.code)));
  return [...sets[0]].filter((c) => sets.every((s) => s.has(c)));
}

// -- subcomponents -------------------------------------------------------------
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < current
                ? "bg-[#002A5C] text-white"
                : i === current
                ? "bg-[#002A5C] text-white ring-4 ring-[#002A5C]/20"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {i < current ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          {i < total - 1 && (
            <div className={`w-8 h-0.5 ${i < current ? "bg-[#002A5C]" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// -- main page -----------------------------------------------------------------
export default function MatchPage() {
  const [step, setStep] = useState<Step>("landing");
  const [mode, setMode] = useState<"create" | "join">("create");
  const [inputMethod, setInputMethod] = useState<InputMethod>("manual");
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [courses, setCourses] = useState<CourseEntry[]>([]);
  const [codeInput, setCodeInput] = useState("");
  const [sectionInput, setSectionInput] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("welcome") === "1") {
      setShowWelcome(true);
      setTimeout(() => setShowWelcome(false), 5000);
    }
  }, [searchParams]);

  // -- course helpers ----------------------------------------------------------
  function addCourse() {
    const code = codeInput.trim().toUpperCase();
    if (!code || courses.find((c) => c.code === code)) return;
    setCourses([...courses, { code, section: sectionInput.trim().toUpperCase() }]);
    setCodeInput("");
    setSectionInput("");
  }

  function removeCourse(code: string) {
    setCourses(courses.filter((c) => c.code !== code));
  }

  // -- OCR ---------------------------------------------------------------------
  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG).");
      return;
    }
    setScanning(true);
    setScanProgress(0);
    setError("");
    try {
      const worker = await createWorker("eng", 1, {
        logger: (m: { progress: number }) => setScanProgress(Math.round(m.progress * 100)),
      });
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      const found = extractCourses(text);
      if (found.length === 0) {
        setError("No UofT course codes found. Try a clearer screenshot or add them manually.");
      } else {
        setCourses((prev) => {
          const existing = new Set(prev.map((c) => c.code));
          return [...prev, ...found.filter((f) => !existing.has(f.code))];
        });
      }
    } catch {
      setError("Scan failed. Try a clearer image or add courses manually.");
    } finally {
      setScanning(false);
      setScanProgress(0);
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  // -- room actions -------------------------------------------------------------
  function submit() {
    if (!name.trim()) { setError("Enter your name."); return; }
    if (courses.length === 0) { setError("Add at least one course."); return; }
    if (mode === "join") {
      const code = joinCode.trim().toUpperCase();
      if (!ROOMS[code]) { setError("Room not found. Check the code."); return; }
      ROOMS[code].members.push({ name: name.trim(), courses });
      setRoom({ ...ROOMS[code] });
      setRoomCode(code);
    } else {
      const code = generateCode();
      const newRoom: Room = { code, members: [{ name: name.trim(), courses }] };
      ROOMS[code] = newRoom;
      setRoom(newRoom);
      setRoomCode(code);
    }
    setStep("room");
    setError("");
  }

  function reset() {
    setStep("landing");
    setName("");
    setCourses([]);
    setRoom(null);
    setError("");
    setJoinCode("");
  }

  function copyCode() {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const overlap = room ? getOverlap(room.members) : [];

  // -- room view -----------------------------------------------------------------
  if (step === "room" && room) {
    return (
      <div className="min-h-screen bg-[#F4F6F9]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
          <button onClick={reset} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-8 transition-colors">
            ← New Session
          </button>

          {/* Room code card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Room Code</p>
              <p className="text-4xl font-black tracking-[0.25em] text-[#002A5C] font-mono">{roomCode}</p>
            </div>
            <button
              onClick={copyCode}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                copied
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-white border-gray-200 text-gray-600 hover:border-[#002A5C] hover:text-[#002A5C]"
              }`}
            >
              {copied ? "✓ Copied" : "Copy Code"}
            </button>
          </div>

          {/* Match result */}
          {overlap.length > 0 ? (
            <div className="bg-[#002A5C] rounded-2xl p-6 mb-4 text-white">
              <p className="text-sm font-bold mb-3 text-white/70 uppercase tracking-widest">
                {overlap.length} Shared Course{overlap.length > 1 ? "s" : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {overlap.map((c) => (
                  <span key={c} className="bg-white text-[#002A5C] text-sm font-black px-4 py-2 rounded-xl font-mono">{c}</span>
                ))}
              </div>
            </div>
          ) : room.members.length > 1 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-4">
              <p className="text-gray-500 font-semibold text-sm">No overlapping courses found.</p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-4">
              <p className="text-[#002A5C] font-semibold text-sm">
                Waiting for friends · share code <span className="font-mono font-black">{roomCode}</span>
              </p>
            </div>
          )}

          {/* Members */}
          <div className="space-y-3">
            {room.members.map((m) => (
              <div key={m.name} className="bg-white border border-gray-100 rounded-2xl p-5">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">{m.name}</p>
                <div className="flex flex-wrap gap-2">
                  {m.courses.map((c) => (
                    <div
                      key={c.code}
                      className={`rounded-xl px-3 py-2 text-xs font-bold font-mono ${
                        overlap.includes(c.code)
                          ? "bg-[#002A5C] text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <p>{c.code}</p>
                      {c.section && <p className="text-[10px] opacity-60 mt-0.5">{c.section}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -- landing -------------------------------------------------------------------
  if (step === "landing") {
    return (
      <div className="min-h-screen bg-[#F4F6F9]">
        {/* Welcome banner */}
        {showWelcome && (
          <div className="bg-[#1a8c4e] text-white px-4 py-3 text-center text-sm font-semibold flex items-center justify-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Profile created! Now add your courses and match with friends.
            <button onClick={() => setShowWelcome(false)} className="ml-2 text-white/60 hover:text-white">&times;</button>
          </div>
        )}
        {/* Hero */}
        <div className="bg-[#002A5C] text-white pt-20 pb-24 px-6 text-center">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Course Matcher</p>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-5">
            See who&apos;s in<br />your classes.
          </h1>
          <p className="text-white/50 text-lg max-w-sm mx-auto mb-10">
            Upload your timetable or enter your courses. Share a code. Instantly see which courses you share with friends.
          </p>

          {/* How it works */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 max-w-xl mx-auto">
            {["Add your courses", "Share the room code", "See your matches"].map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <span className="w-6 h-6 rounded-full border border-white/20 text-white/50 text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                  {s}
                </div>
                {i < 2 && <span className="text-white/20 hidden sm:block">→</span>}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => { setMode("create"); setStep("setup"); }}
              className="bg-white text-[#002A5C] font-bold px-8 py-3.5 rounded-xl text-sm hover:bg-gray-100 transition-colors"
            >
              Create a Room →
            </button>
            <button
              onClick={() => { setMode("join"); setStep("setup"); }}
              className="bg-white/10 border border-white/20 text-white font-semibold px-8 py-3.5 rounded-xl text-sm hover:bg-white/15 transition-colors"
            >
              Join a Room
            </button>
          </div>
        </div>

        {/* Feature pills */}
        <div className="max-w-3xl mx-auto px-6 py-12 grid sm:grid-cols-3 gap-4">
          {[
            { title: "Screenshot Scan", desc: "Upload your ACORN timetable and we'll extract your courses automatically." },
            { title: "Manual Entry", desc: "Type in course codes and section numbers directly." },
            { title: "No Account Needed", desc: "Fully anonymous. Nothing stored after your session ends." },
          ].map((f) => (
            <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="font-bold text-sm text-black mb-2">{f.title}</p>
              <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -- setup ---------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-14">
        <button onClick={() => setStep("landing")} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors">
          ← Back
        </button>

        <StepIndicator current={1} total={3} />

        <h1 className="text-2xl font-black text-black mb-1">
          {mode === "create" ? "Create a Room" : "Join a Room"}
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          {mode === "create" ? "Add your courses and share the code with friends." : "Enter the room code and your courses."}
        </p>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
          {/* Join code */}
          {mode === "join" && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Room Code</label>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                maxLength={6}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 font-mono text-2xl tracking-[0.3em] text-center text-[#002A5C] font-black focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
              />
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Your Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First name or nickname"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
            />
          </div>

          {/* Input method toggle */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Add Courses Via</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
              {(["manual", "screenshot"] as InputMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setInputMethod(m)}
                  className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                    inputMethod === m ? "bg-white text-[#002A5C] shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {m === "manual" ? "Manual Entry" : "Screenshot Upload"}
                </button>
              ))}
            </div>
          </div>

          {/* Manual entry */}
          {inputMethod === "manual" && (
            <div>
              <div className="flex gap-2 mb-3">
                <input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCourse()}
                  placeholder="Course code  e.g. CSC108H1"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                />
                <input
                  value={sectionInput}
                  onChange={(e) => setSectionInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCourse()}
                  placeholder="Section  e.g. LEC0101"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                />
                <button
                  onClick={addCourse}
                  className="bg-[#002A5C] text-white px-4 rounded-xl font-bold text-sm hover:bg-black transition-colors shrink-0"
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-gray-400">Press Enter or click Add. Section is optional.</p>
            </div>
          )}

          {/* Screenshot upload */}
          {inputMethod === "screenshot" && (
            <div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => !scanning && fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-[#002A5C] bg-blue-50"
                    : scanning
                    ? "border-gray-200 bg-gray-50 cursor-default"
                    : "border-gray-200 hover:border-[#002A5C] hover:bg-gray-50"
                }`}
              >
                {scanning ? (
                  <div>
                    <div className="w-10 h-10 rounded-full border-2 border-[#002A5C] border-t-transparent animate-spin mx-auto mb-3" />
                    <p className="text-sm font-semibold text-[#002A5C]">Scanning timetable...</p>
                    <div className="w-48 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 overflow-hidden">
                      <div className="h-full bg-[#002A5C] rounded-full transition-all" style={{ width: `${scanProgress}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{scanProgress}%</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Drop your timetable screenshot here</p>
                    <p className="text-xs text-gray-400 mb-3">or click to browse · PNG, JPG supported</p>
                    <p className="text-xs text-gray-300">Works best with ACORN or course calendar screenshots</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          )}

          {/* Course pills */}
          {courses.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{courses.length} Course{courses.length > 1 ? "s" : ""} Added</p>
              <div className="flex flex-wrap gap-2">
                {courses.map((c) => (
                  <div key={c.code} className="bg-[#002A5C] text-white text-xs font-bold px-3 py-2 rounded-xl font-mono flex items-start gap-2">
                    <div>
                      <p>{c.code}</p>
                      {c.section && <p className="text-white/50 text-[10px]">{c.section}</p>}
                    </div>
                    <button onClick={() => removeCourse(c.code)} className="text-white/40 hover:text-white mt-0.5 transition-colors">Ã—</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

          <button
            onClick={submit}
            disabled={scanning}
            className="w-full bg-[#002A5C] text-white font-bold py-3.5 rounded-xl text-sm hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mode === "create" ? "Create Room →" : "Join Room →"}
          </button>
        </div>
      </div>
    </div>
  );
}
