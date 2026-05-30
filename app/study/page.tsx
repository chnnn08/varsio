"use client";

import { useEffect, useState } from "react";
import { getProfile, type Profile } from "@/lib/profile";
import Link from "next/link";

// -- types ---------------------------------------------------------------------
type QuizQuestion = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

type SessionMessage = {
  id: string;
  author: string;
  text: string;
  time: string;
  reported: boolean;
};

type StudySession = {
  id: string;
  code: string;
  title: string;
  subject: string;
  hostName: string;
  isPublic: boolean;
  participants: string[];
  materials: string;
  quizzes: QuizQuestion[];
  messages: SessionMessage[];
};

type View = "list" | "create" | "session";
type SessionTab = "materials" | "quiz" | "chat";
type QuizState = "idle" | "generating" | "ready" | "taking" | "done";

// -- persistence helpers -------------------------------------------------------
function persistSessions(s: Record<string, StudySession>) {
  try { localStorage.setItem("varsio_sessions", JSON.stringify(s)); } catch {}
}
function loadSessions(): Record<string, StudySession> {
  try {
    const raw = localStorage.getItem("varsio_sessions");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

// -- in-memory store -----------------------------------------------------------
const SESSIONS: Record<string, StudySession> = {
  demo1: {
    id: "demo1",
    code: "DEMO01",
    title: "CSC148 - Trees & Recursion",
    subject: "CSC148H1",
    hostName: "alex_cs",
    isPublic: true,
    participants: ["alex_cs", "maya_t"],
    materials: "",
    quizzes: [],
    messages: [
      { id: "1", author: "alex_cs", text: "Anyone want to go over the recursion questions from the last problem set?", time: "1h ago", reported: false },
      { id: "2", author: "maya_t", text: "Yes! I'm struggling with binary tree traversal. Let's start there.", time: "45m ago", reported: false },
    ],
  },
  demo2: {
    id: "demo2",
    code: "DEMO02",
    title: "MAT137 Midterm Prep",
    subject: "MAT137Y1",
    hostName: "james_w",
    isPublic: true,
    participants: ["james_w"],
    materials: "",
    quizzes: [],
    messages: [],
  },
};

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// -- component ------------------------------------------------------------------
export default function StudyPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [view, setView] = useState<View>("list");
  const [sessions, setSessions] = useState<Record<string, StudySession>>(() => {
    const saved = loadSessions();
    const merged = { ...SESSIONS, ...saved };
    Object.assign(SESSIONS, merged);
    return merged;
  });
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [tab, setTab] = useState<SessionTab>("materials");

  // create form
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [formError, setFormError] = useState("");

  // materials
  const [materialsText, setMaterialsText] = useState("");
  const [genError, setGenError] = useState("");

  // quiz
  const [quizState, setQuizState] = useState<QuizState>("idle");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);

  // chat
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  // -- helpers ----------------------------------------------------------------
  function openSession(s: StudySession) {
    if (profile && !s.participants.includes(profile.displayName)) {
      const updated = { ...s, participants: [...s.participants, profile.displayName] };
      setSessions((prev) => ({ ...prev, [s.id]: updated }));
      setActiveSession(updated);
    } else {
      setActiveSession(s);
    }
    setTab("materials");
    setView("session");
    setQuizState(s.quizzes.length > 0 ? "ready" : "idle");
    setQuestions(s.quizzes);
    setMaterialsText(s.materials);
  }

  function createSession() {
    if (!profile) return;
    if (!title.trim() || !subject.trim()) { setFormError("Title and subject are required."); return; }
    const id = generateId();
    const session: StudySession = {
      id, code: generateCode(), title: title.trim(), subject: subject.trim().toUpperCase(),
      hostName: profile.displayName, isPublic,
      participants: [profile.displayName], materials: "", quizzes: [], messages: [],
    };
    const next = { ...sessions, [id]: session };
    updateSessions(next);
    setTitle(""); setSubject(""); setIsPublic(true); setFormError("");
    openSession(session);
  }

  function updateSessions(updated: Record<string, StudySession>) {
    setSessions(updated);
    persistSessions(updated);
  }

  function joinPrivate() {
    const code = joinCodeInput.trim().toUpperCase();
    // check current state AND localStorage (in case created in another tab)
    let session = Object.values(sessions).find((s) => s.code === code);
    if (!session) {
      const saved = loadSessions();
      session = Object.values(saved).find((s) => s.code === code);
      if (session) updateSessions({ ...sessions, ...saved });
    }
    if (!session) { setFormError("Room not found."); return; }
    setJoinCodeInput(""); setFormError("");
    openSession(session);
  }

  async function generateQuiz() {
    if (!materialsText.trim()) { setGenError("Paste some study material first."); return; }
    setQuizState("generating");
    setGenError("");

    // save materials to session
    if (activeSession) {
      const updated = { ...activeSession, materials: materialsText };
      setSessions((prev) => ({ ...prev, [activeSession.id]: updated }));
      setActiveSession(updated);
    }

    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materials: materialsText }),
      });
      const data = await res.json();
      if (data.error) { setGenError(data.error); setQuizState("idle"); return; }
      setQuestions(data.questions);
      if (activeSession) {
        const updated = { ...activeSession, materials: materialsText, quizzes: data.questions };
        setSessions((prev) => ({ ...prev, [activeSession.id]: updated }));
        setActiveSession(updated);
      }
      setQuizState("ready");
      setTab("quiz");
    } catch {
      setGenError("Something went wrong. Check your API key in .env.local.");
      setQuizState("idle");
    }
  }

  function startQuiz() {
    setCurrentQ(0);
    setSelected(null);
    setAnswers([]);
    setShowExplanation(false);
    setQuizState("taking");
  }

  function submitAnswer() {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setShowExplanation(true);
  }

  function nextQuestion() {
    if (currentQ + 1 >= questions.length) {
      setQuizState("done");
    } else {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setShowExplanation(false);
    }
  }

  function sendMessage() {
    if (!chatInput.trim() || !profile || !activeSession) return;
    const msg: SessionMessage = {
      id: Date.now().toString(), author: profile.displayName,
      text: chatInput.trim(), time: "just now", reported: false,
    };
    const updated = { ...activeSession, messages: [...activeSession.messages, msg] };
    setSessions((prev) => ({ ...prev, [activeSession.id]: updated }));
    setActiveSession(updated);
    setChatInput("");
  }

  function reportMessage(msgId: string) {
    if (!activeSession) return;
    const updated = {
      ...activeSession,
      messages: activeSession.messages.map((m) => m.id === msgId ? { ...m, reported: true } : m),
    };
    setSessions((prev) => ({ ...prev, [activeSession.id]: updated }));
    setActiveSession(updated);
  }

  const score = answers.filter((a, i) => a === questions[i]?.answer).length;
  const publicSessions = Object.values(sessions).filter((s) => s.isPublic);

  // -- no profile guard ------------------------------------------------------
  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#002A5C] text-white flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <h2 className="text-xl font-black text-black mb-2">Profile Required</h2>
          <p className="text-gray-400 text-sm mb-6">Create a profile to join or host study sessions. Your display name will appear in sessions.</p>
          <Link href="/profile" className="block bg-[#002A5C] text-white font-bold py-3 rounded-xl text-sm hover:bg-black transition-colors">
            Create Profile →
          </Link>
        </div>
      </div>
    );
  }

  // -- session view ---------------------------------------------------------
  if (view === "session" && activeSession) {
    return (
      <div className="min-h-screen bg-[#F4F6F9]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <button onClick={() => setView("list")} className="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1.5 mb-6 transition-colors">
            ← Back to Sessions
          </button>

          {/* Session header */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeSession.isPublic ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                    {activeSession.isPublic ? "Public" : "Private"}
                  </span>
                  <span className="text-xs font-mono font-bold text-gray-300">{activeSession.code}</span>
                </div>
                <h1 className="text-xl font-black text-black">{activeSession.title}</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  Hosted by <span className="font-semibold text-[#002A5C]">{activeSession.hostName}</span>
                  {" · "}{activeSession.participants.length} participant{activeSession.participants.length !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="bg-[#002A5C]/8 text-[#002A5C] text-xs font-bold px-3 py-1.5 rounded-xl font-mono shrink-0">
                {activeSession.subject}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-white border border-gray-100 rounded-2xl p-1.5">
            {(["materials", "quiz", "chat"] as SessionTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                  tab === t ? "bg-[#002A5C] text-white" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "quiz" && questions.length > 0 ? `Quiz (${questions.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Materials tab */}
          {tab === "materials" && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h2 className="font-black text-black mb-1">Study Materials</h2>
              <p className="text-xs text-gray-400 mb-4">Paste your notes, lecture slides, or textbook excerpts. Then generate a quiz.</p>
              <textarea
                value={materialsText}
                onChange={(e) => setMaterialsText(e.target.value)}
                placeholder="Paste your study material here - lecture notes, textbook sections, problem sets..."
                rows={10}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#002A5C] mb-4"
              />
              {genError && <p className="text-red-500 text-xs mb-3 font-medium">{genError}</p>}
              <button
                onClick={generateQuiz}
                disabled={quizState === "generating" || !materialsText.trim()}
                className="w-full bg-[#002A5C] text-white font-bold py-3.5 rounded-xl text-sm hover:bg-black transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {quizState === "generating" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating quiz with AI...
                  </>
                ) : (
                  "Generate Quiz with AI →"
                )}
              </button>
            </div>
          )}

          {/* Quiz tab */}
          {tab === "quiz" && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              {quizState === "idle" && (
                <div className="text-center py-12 text-gray-400">
                  <p className="font-semibold text-sm">No quiz yet</p>
                  <p className="text-xs mt-1">Add materials and generate a quiz first.</p>
                </div>
              )}

              {quizState === "ready" && (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-[#1a8c4e] text-white flex items-center justify-center mx-auto mb-5">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h2 className="text-xl font-black text-black mb-2">{questions.length} Questions Ready</h2>
                  <p className="text-gray-400 text-sm mb-6">Generated by AI from your study materials.</p>
                  <button
                    onClick={startQuiz}
                    className="bg-[#002A5C] text-white font-bold px-8 py-3.5 rounded-xl text-sm hover:bg-black transition-colors"
                  >
                    Start Quiz →
                  </button>
                </div>
              )}

              {quizState === "taking" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">
                      Question {currentQ + 1} of {questions.length}
                    </p>
                    <div className="flex gap-1">
                      {questions.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i < currentQ ? "bg-[#002A5C]" : i === currentQ ? "bg-[#002A5C]" : "bg-gray-200"}`} />
                      ))}
                    </div>
                  </div>

                  <p className="text-base font-bold text-black mb-5 leading-snug">{questions[currentQ].question}</p>

                  <div className="space-y-2 mb-5">
                    {questions[currentQ].options.map((opt, i) => {
                      let style = "border-gray-200 text-gray-700 hover:border-[#002A5C] hover:bg-blue-50";
                      if (showExplanation) {
                        if (i === questions[currentQ].answer) style = "border-green-400 bg-green-50 text-green-800";
                        else if (i === selected) style = "border-red-300 bg-red-50 text-red-700";
                        else style = "border-gray-100 text-gray-400";
                      } else if (i === selected) {
                        style = "border-[#002A5C] bg-[#002A5C]/5 text-[#002A5C]";
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => !showExplanation && setSelected(i)}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${style}`}
                        >
                          <span className="font-bold mr-2">{["A", "B", "C", "D"][i]}.</span>{opt}
                        </button>
                      );
                    })}
                  </div>

                  {showExplanation && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 text-sm text-[#002A5C]">
                      <p className="font-bold mb-1">Explanation</p>
                      <p className="text-[#002A5C]/70">{questions[currentQ].explanation}</p>
                    </div>
                  )}

                  {!showExplanation ? (
                    <button
                      onClick={submitAnswer}
                      disabled={selected === null}
                      className="w-full bg-[#002A5C] text-white font-bold py-3 rounded-xl text-sm hover:bg-black transition-colors disabled:opacity-40"
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      onClick={nextQuestion}
                      className="w-full bg-[#002A5C] text-white font-bold py-3 rounded-xl text-sm hover:bg-black transition-colors"
                    >
                      {currentQ + 1 < questions.length ? "Next Question →" : "See Results →"}
                    </button>
                  )}
                </div>
              )}

              {quizState === "done" && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-2xl bg-[#002A5C] text-white text-3xl font-black flex items-center justify-center mx-auto mb-4">
                    {score}/{questions.length}
                  </div>
                  <h2 className="text-xl font-black text-black mb-1">
                    {score === questions.length ? "Perfect Score!" : score >= questions.length / 2 ? "Good Work!" : "Keep Studying!"}
                  </h2>
                  <p className="text-gray-400 text-sm mb-6">You got {score} out of {questions.length} correct.</p>
                  <div className="flex gap-3 justify-center">
                    <button onClick={startQuiz} className="bg-[#002A5C] text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-black transition-colors">
                      Retry Quiz
                    </button>
                    <button onClick={() => setTab("materials")} className="border border-gray-200 text-gray-600 font-semibold px-6 py-3 rounded-xl text-sm hover:border-gray-400 transition-colors">
                      Edit Materials
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat tab */}
          {tab === "chat" && (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="p-5 min-h-64 space-y-3 max-h-96 overflow-y-auto">
                {activeSession.messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-300">
                    <p className="text-sm">No messages yet. Start the conversation.</p>
                  </div>
                ) : (
                  activeSession.messages.map((m) => (
                    <div key={m.id} className={`${m.reported ? "opacity-40" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-lg bg-[#002A5C] text-white text-xs font-black flex items-center justify-center shrink-0">
                            {m.author[0].toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-[#002A5C]">{m.author}</span>
                          <span className="text-xs text-gray-300">{m.time}</span>
                        </div>
                        {!m.reported && m.author !== profile.displayName && (
                          <button
                            onClick={() => reportMessage(m.id)}
                            className="text-xs text-gray-300 hover:text-red-400 transition-colors shrink-0"
                            title="Report message"
                          >
                            Report
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 ml-8">{m.reported ? "[Reported - under review]" : m.text}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-gray-100 p-4 flex gap-3">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder={`Message as ${profile.displayName}...`}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                />
                <button
                  onClick={sendMessage}
                  className="bg-[#002A5C] text-white px-5 rounded-xl font-bold text-sm hover:bg-black transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -- create form ------------------------------------------------------------
  if (view === "create") {
    return (
      <div className="min-h-screen bg-[#F4F6F9]">
        <div className="max-w-lg mx-auto px-6 py-14">
          <button onClick={() => setView("list")} className="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1.5 mb-8 transition-colors">← Back</button>
          <h1 className="text-2xl font-black text-black mb-8">Create a Study Session</h1>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Session Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. MAT137 Midterm Prep" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Course Code</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. MAT137Y1" className="w-full border border-gray-200 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Visibility</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                {[true, false].map((pub) => (
                  <button key={String(pub)} onClick={() => setIsPublic(pub)} className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${isPublic === pub ? "bg-white text-[#002A5C] shadow-sm" : "text-gray-500"}`}>
                    {pub ? "Public" : "Private"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {isPublic ? "Anyone can find and join this session." : "Only people with the room code can join."}
              </p>
            </div>
            {formError && <p className="text-red-500 text-xs font-medium">{formError}</p>}
            <button onClick={createSession} className="w-full bg-[#002A5C] text-white font-bold py-3.5 rounded-xl text-sm hover:bg-black transition-colors">
              Create Session →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -- list view --------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <div className="bg-[#002A5C] text-white py-14 px-6">
        <div className="max-w-4xl mx-auto flex items-end justify-between gap-4">
          <div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">AI Study Sessions</p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">Study Sessions</h1>
            <p className="text-white/50 text-sm">Upload materials, generate AI quizzes, and study with friends.</p>
          </div>
          <button
            onClick={() => setView("create")}
            className="shrink-0 bg-white text-[#002A5C] font-bold px-6 py-3 rounded-xl text-sm hover:bg-gray-100 transition-colors"
          >
            + Create Session
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Join private */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-8 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Join Private Session</label>
            <input
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              maxLength={6}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
            />
          </div>
          <button onClick={joinPrivate} className="bg-[#002A5C] text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-black transition-colors shrink-0">
            Join
          </button>
          {formError && <p className="text-red-500 text-xs">{formError}</p>}
        </div>

        {/* Public sessions */}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Public Sessions</p>
        {publicSessions.length === 0 ? (
          <div className="text-center py-16 text-gray-300">
            <p className="text-sm font-semibold">No public sessions yet - create the first one</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {publicSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => openSession(s)}
                className="bg-white border border-gray-100 rounded-2xl p-5 text-left hover:border-[#002A5C]/30 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="bg-[#002A5C]/8 text-[#002A5C] text-xs font-bold px-2.5 py-1 rounded-lg font-mono">{s.subject}</span>
                  <span className="text-xs text-gray-400">{s.participants.length} joined</span>
                </div>
                <h3 className="font-bold text-black text-sm mb-1 group-hover:text-[#002A5C] transition-colors">{s.title}</h3>
                <p className="text-xs text-gray-400">Hosted by {s.hostName}</p>
                {s.quizzes.length > 0 && (
                  <p className="text-xs text-green-600 font-semibold mt-2">✓ {s.quizzes.length} quiz questions ready</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
