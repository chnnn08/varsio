"use client";

import { useState, useEffect } from "react";
import { getProfile, type Profile } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { track } from "@vercel/analytics";
import Link from "next/link";

function StudyQuizTabs({ active }: { active: "study" | "quiz" }) {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex">
        <Link
          href="/study"
          className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all ${
            active === "study" ? "border-[#002A5C] text-[#002A5C]" : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          Study Sessions
        </Link>
        <Link
          href="/quiz"
          className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all ${
            active === "quiz" ? "border-[#002A5C] text-[#002A5C]" : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          Quiz Bank
        </Link>
      </div>
    </div>
  );
}

// -- types ---------------------------------------------------------------------
type QuizQuestion = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

type Quiz = {
  id: string;
  code: string;
  title: string;
  course: string;
  createdBy: string;
  questions: QuizQuestion[];
};

type View = "home" | "new" | "build-manual" | "build-ai" | "preview" | "take" | "results";

// -- shared in-memory store (lets friends join by code in same session) --------
const QUIZ_STORE: Record<string, Quiz> = {};

function generateId() { return Math.random().toString(36).substring(2, 10); }
function generateCode() { return Math.random().toString(36).substring(2, 8).toUpperCase(); }

function rowToQuiz(row: Record<string, unknown>): Quiz {
  return {
    id: row.id as string,
    code: row.code as string,
    title: row.title as string,
    course: (row.course as string) ?? "",
    createdBy: row.created_by as string,
    questions: (row.questions as QuizQuestion[]) ?? [],
  };
}

function blankQuestion() {
  return { id: generateId(), question: "", options: ["", "", "", ""], answer: 0, explanation: "" };
}

// -- component -----------------------------------------------------------------
export default function QuizPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [view, setView] = useState<View>("home");
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);

  // new quiz form
  const [quizTitle, setQuizTitle] = useState("");
  const [quizCourse, setQuizCourse] = useState("");
  const [createMode, setCreateMode] = useState<"manual" | "ai">("manual");

  // manual builder
  const [builtQs, setBuiltQs] = useState<(QuizQuestion & { id: string })[]>([]);
  const [draft, setDraft] = useState(blankQuestion());
  const [addError, setAddError] = useState("");

  // AI builder
  const [materials, setMaterials] = useState("");
  const [aiQuestions, setAiQuestions] = useState<QuizQuestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  // active quiz / join
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [copied, setCopied] = useState(false);

  // taking quiz
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showExp, setShowExp] = useState(false);

  useEffect(() => {
    async function init() {
      const p = await getProfile();
      setProfile(p);
      if (p) {
        const { data } = await supabase.from("quizzes").select("*").eq("created_by", p.displayName).order("created_at", { ascending: false });
        if (data) {
          const quizzes = data.map((r) => rowToQuiz(r as Record<string, unknown>));
          quizzes.forEach((q) => { QUIZ_STORE[q.code] = q; });
          setMyQuizzes(quizzes);
        }
      }
    }
    init();
  }, []);

  // -- helpers ----------------------------------------------------------------
  function resetNew() {
    setQuizTitle(""); setQuizCourse(""); setCreateMode("manual");
    setBuiltQs([]); setDraft(blankQuestion()); setAddError("");
    setMaterials(""); setAiQuestions([]); setGenError("");
  }

  async function saveAndPreview(questions: QuizQuestion[]) {
    if (!profile || questions.length === 0) return;
    const quiz: Quiz = {
      id: generateId(), code: generateCode(),
      title: quizTitle.trim() || "Untitled Quiz",
      course: quizCourse.trim().toUpperCase(),
      createdBy: profile.displayName, questions,
    };
    QUIZ_STORE[quiz.code] = quiz;
    setMyQuizzes((prev) => [quiz, ...prev]);
    await supabase.from("quizzes").insert({
      id: quiz.id, code: quiz.code, title: quiz.title,
      course: quiz.course || null, created_by: quiz.createdBy, questions: quiz.questions,
    });
    track("quiz_created", { questions: questions.length, course: quiz.course, mode: createMode });
    setActiveQuiz(quiz);
    setView("preview");
    resetNew();
  }

  async function joinByCode() {
    const code = joinCode.trim().toUpperCase();
    let quiz = QUIZ_STORE[code];
    if (!quiz) {
      const { data } = await supabase.from("quizzes").select("*").eq("code", code).single();
      if (data) {
        quiz = rowToQuiz(data as Record<string, unknown>);
        QUIZ_STORE[quiz.code] = quiz;
      }
    }
    if (!quiz) { setJoinError("Quiz not found. Check the code and try again."); return; }
    setJoinError(""); setJoinCode("");
    setActiveQuiz(quiz); setView("preview");
  }

  function startQuiz() {
    setQIndex(0); setSelected(null); setAnswers([]); setShowExp(false);
    setView("take");
  }

  function submitAnswer() {
    if (selected === null) return;
    setAnswers((a) => [...a, selected]);
    setShowExp(true);
  }

  function nextQuestion() {
    if (!activeQuiz) return;
    if (qIndex + 1 >= activeQuiz.questions.length) { setView("results"); return; }
    setQIndex((i) => i + 1); setSelected(null); setShowExp(false);
  }

  function addManualQuestion() {
    if (!draft.question.trim()) { setAddError("Enter a question."); return; }
    if (draft.options.some((o) => !o.trim())) { setAddError("Fill in all 4 options."); return; }
    setBuiltQs((qs) => [...qs, { ...draft }]);
    setDraft(blankQuestion()); setAddError("");
  }

  async function generateFromMaterials() {
    if (!materials.trim()) { setGenError("Paste some study material first."); return; }
    setGenerating(true); setGenError("");
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materials }),
      });
      const data = await res.json();
      if (data.error) { setGenError(data.error); setGenerating(false); return; }
      setAiQuestions(data.questions);
    } catch { setGenError("Something went wrong. Check your API key in .env.local."); }
    setGenerating(false);
  }

  const score = activeQuiz
    ? answers.filter((a, i) => a === activeQuiz.questions[i]?.answer).length
    : 0;

  // -- no profile guard -------------------------------------------------------
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center px-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#002A5C] text-white flex items-center justify-center mx-auto mb-4 text-xl font-black">?</div>
          <h2 className="text-xl font-black text-black mb-2">Profile Required</h2>
          <p className="text-gray-400 text-sm mb-6">Create a profile to make and share quizzes.</p>
          <Link href="/profile" className="block bg-[#002A5C] text-white font-bold py-3 rounded-xl text-sm hover:bg-black transition-colors">
            Create Profile →
          </Link>
        </div>
      </div>
    );
  }

  // -- results view -----------------------------------------------------------
  if (view === "results" && activeQuiz) {
    const total = activeQuiz.questions.length;
    const pct = Math.round((score / total) * 100);
    return (
      <div className="min-h-screen bg-[#F4F6F9]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center mb-5">
            <div className={`w-24 h-24 rounded-2xl text-white text-3xl font-black flex items-center justify-center mx-auto mb-5 ${pct === 100 ? "bg-[#1a8c4e]" : pct >= 60 ? "bg-[#002A5C]" : "bg-gray-400"}`}>
              {pct}%
            </div>
            <h2 className="text-2xl font-black text-black mb-1">
              {pct === 100 ? "Perfect Score!" : pct >= 60 ? "Great Work!" : "Keep Studying!"}
            </h2>
            <p className="text-gray-400 text-sm mb-6">{score} of {total} correct on &quot;{activeQuiz.title}&quot;</p>
            <div className="flex gap-3 justify-center">
              <button onClick={startQuiz} className="bg-[#002A5C] text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-black transition-colors">
                Retry
              </button>
              <button onClick={() => setView("preview")} className="border border-gray-200 text-gray-600 font-semibold px-6 py-3 rounded-xl text-sm hover:border-gray-400 transition-colors">
                Back to Quiz
              </button>
            </div>
          </div>

          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Breakdown</p>
          <div className="space-y-3">
            {activeQuiz.questions.map((q, i) => (
              <div key={i} className={`bg-white border rounded-2xl p-4 ${answers[i] === q.answer ? "border-green-100" : "border-red-100"}`}>
                <div className="flex items-start gap-3">
                  <span className={`text-xs font-black px-2 py-1 rounded-lg mt-0.5 shrink-0 ${answers[i] === q.answer ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                    {answers[i] === q.answer ? "✓" : "✗"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black mb-1 leading-snug">{q.question}</p>
                    {answers[i] !== q.answer && (
                      <p className="text-xs text-red-500 mb-0.5">Your answer: {q.options[answers[i]]}</p>
                    )}
                    <p className="text-xs text-green-700 font-semibold">Correct: {q.options[q.answer]}</p>
                    {q.explanation && <p className="text-xs text-gray-400 mt-1 leading-relaxed">{q.explanation}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -- take view --------------------------------------------------------------
  if (view === "take" && activeQuiz) {
    const q = activeQuiz.questions[qIndex];
    const total = activeQuiz.questions.length;
    return (
      <div className="min-h-screen bg-[#F4F6F9]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          {/* progress bar */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-bold text-gray-400 shrink-0">{qIndex + 1}/{total}</span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#002A5C] rounded-full transition-all duration-300"
                style={{ width: `${((qIndex) / total) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-300 shrink-0">{activeQuiz.title}</span>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
            <p className="text-base font-bold text-black mb-5 leading-snug">{q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                let cls = "border-gray-200 text-gray-700 hover:border-[#002A5C] hover:bg-blue-50/50 cursor-pointer";
                if (showExp) {
                  if (i === q.answer) cls = "border-green-400 bg-green-50 text-green-800";
                  else if (i === selected) cls = "border-red-300 bg-red-50 text-red-700";
                  else cls = "border-gray-100 text-gray-300 cursor-default";
                } else if (i === selected) {
                  cls = "border-[#002A5C] bg-[#002A5C]/5 text-[#002A5C]";
                }
                return (
                  <button
                    key={i}
                    onClick={() => !showExp && setSelected(i)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${cls}`}
                  >
                    <span className="font-black text-xs mr-2.5">{["A", "B", "C", "D"][i]}</span>{opt}
                  </button>
                );
              })}
            </div>
          </div>

          {showExp && q.explanation && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold text-[#002A5C] mb-1">Explanation</p>
              <p className="text-sm text-[#002A5C]/70 leading-relaxed">{q.explanation}</p>
            </div>
          )}

          {!showExp ? (
            <button
              onClick={submitAnswer}
              disabled={selected === null}
              className="w-full bg-[#002A5C] text-white font-bold py-3.5 rounded-xl text-sm hover:bg-black transition-colors disabled:opacity-40"
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="w-full bg-[#002A5C] text-white font-bold py-3.5 rounded-xl text-sm hover:bg-black transition-colors"
            >
              {qIndex + 1 < total ? "Next Question →" : "See Results →"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // -- preview view -----------------------------------------------------------
  if (view === "preview" && activeQuiz) {
    return (
      <div className="min-h-screen bg-[#F4F6F9]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          <button onClick={() => setView("home")} className="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1.5 mb-6 transition-colors">
            ← Back to Quizzes
          </button>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
            <p className="text-xs text-gray-400 mb-1">
              {activeQuiz.course || "No course"} · by {activeQuiz.createdBy}
            </p>
            <h1 className="text-xl font-black text-black mb-0.5">{activeQuiz.title}</h1>
            <p className="text-sm text-gray-400 mb-5">{activeQuiz.questions.length} questions</p>

            {/* Share code block */}
            <div className="bg-[#002A5C] rounded-2xl p-5 mb-5">
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Share Code</p>
              <div className="flex items-center justify-between gap-4">
                <span className="text-white text-4xl font-black tracking-[0.2em] font-mono">{activeQuiz.code}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(activeQuiz.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${copied ? "bg-[#1a8c4e] text-white" : "bg-white/15 text-white hover:bg-white/25"}`}
                >
                  {copied ? "Copied!" : "Copy Code"}
                </button>
              </div>
              <p className="text-white/40 text-xs mt-2">Friends go to Quiz and enter this code to take your quiz</p>
            </div>

            <button
              onClick={startQuiz}
              className="w-full bg-[#F0B429] text-[#002A5C] font-black py-4 rounded-xl text-sm hover:bg-yellow-400 transition-colors"
            >
              Start Quiz →
            </button>
          </div>

          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">All Questions</p>
          <div className="space-y-3">
            {activeQuiz.questions.map((q, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4">
                <p className="text-sm font-bold text-black mb-2">Q{i + 1}. {q.question}</p>
                <div className="space-y-1">
                  {q.options.map((opt, j) => (
                    <p key={j} className={`text-xs px-2.5 py-1.5 rounded-lg ${j === q.answer ? "bg-green-50 text-green-700 font-semibold" : "text-gray-400"}`}>
                      <span className="font-bold mr-1">{["A","B","C","D"][j]}.</span>{opt}
                    </p>
                  ))}
                </div>
                {q.explanation && <p className="text-xs text-gray-300 mt-2 italic">{q.explanation}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -- build AI view ----------------------------------------------------------
  if (view === "build-ai") {
    return (
      <div className="min-h-screen bg-[#F4F6F9]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          <button onClick={() => setView("new")} className="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1.5 mb-6 transition-colors">← Back</button>
          <h1 className="text-2xl font-black text-black mb-1">Generate from Materials</h1>
          <p className="text-sm text-gray-400 mb-6">
            For: <span className="font-semibold text-black">{quizTitle}</span>
            {quizCourse && <span className="text-[#002A5C] font-mono text-xs ml-2">{quizCourse}</span>}
          </p>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Paste Your Study Material</label>
            <textarea
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder="Paste lecture notes, textbook sections, slides, or any study material here. The more detail, the better the questions."
              rows={12}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#002A5C] mb-4"
            />
            {genError && <p className="text-red-500 text-xs mb-3 font-medium">{genError}</p>}
            <button
              onClick={generateFromMaterials}
              disabled={generating || !materials.trim()}
              className="w-full bg-[#002A5C] text-white font-bold py-3.5 rounded-xl text-sm hover:bg-black transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {generating ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating with AI...</>
              ) : "Generate Quiz with AI →"}
            </button>
          </div>

          {aiQuestions.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{aiQuestions.length} Questions Generated</p>
                <button onClick={generateFromMaterials} disabled={generating} className="text-xs text-[#002A5C] font-semibold hover:underline disabled:opacity-40">
                  Regenerate
                </button>
              </div>
              <div className="space-y-3 mb-5">
                {aiQuestions.map((q, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4">
                    <p className="text-sm font-bold text-black mb-2">Q{i + 1}. {q.question}</p>
                    <div className="space-y-1">
                      {q.options.map((opt, j) => (
                        <p key={j} className={`text-xs px-2.5 py-1.5 rounded-lg ${j === q.answer ? "bg-green-50 text-green-700 font-semibold" : "text-gray-400"}`}>
                          <span className="font-bold mr-1">{["A","B","C","D"][j]}.</span>{opt}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => saveAndPreview(aiQuestions)}
                className="w-full bg-[#1a8c4e] text-white font-bold py-3.5 rounded-xl text-sm hover:bg-green-700 transition-colors"
              >
                Save Quiz & Get Share Code →
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // -- build manual view ------------------------------------------------------
  if (view === "build-manual") {
    return (
      <div className="min-h-screen bg-[#F4F6F9]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          <button onClick={() => setView("new")} className="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1.5 mb-6 transition-colors">← Back</button>
          <h1 className="text-2xl font-black text-black mb-1">Add Questions</h1>
          <p className="text-sm text-gray-400 mb-6">
            <span className="font-semibold text-black">{quizTitle}</span>
            {quizCourse && <span className="text-[#002A5C] font-mono text-xs ml-2">{quizCourse}</span>}
          </p>

          {/* Questions added so far */}
          {builtQs.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                {builtQs.length} Question{builtQs.length !== 1 ? "s" : ""} Added
              </p>
              <div className="space-y-2">
                {builtQs.map((q, i) => (
                  <div key={q.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-black truncate flex-1">Q{i + 1}. {q.question}</p>
                    <button
                      onClick={() => setBuiltQs((qs) => qs.filter((x) => x.id !== q.id))}
                      className="text-gray-300 hover:text-red-400 transition-colors text-xs font-bold shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add question form */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              {builtQs.length === 0 ? "Add Your First Question" : "Add Another Question"}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Question</label>
                <textarea
                  value={draft.question}
                  onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
                  placeholder="e.g. What is the time complexity of binary search?"
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">
                  Answer Options — <span className="font-normal">click the circle to mark the correct answer</span>
                </label>
                <div className="space-y-2">
                  {draft.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <button
                        onClick={() => setDraft((d) => ({ ...d, answer: i }))}
                        className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${draft.answer === i ? "border-[#1a8c4e] bg-[#1a8c4e]" : "border-gray-300 hover:border-gray-400"}`}
                      >
                        {draft.answer === i && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <span className="text-xs font-bold text-gray-400 w-4 shrink-0">{["A","B","C","D"][i]}</span>
                      <input
                        value={opt}
                        onChange={(e) => setDraft((d) => {
                          const opts = [...d.options]; opts[i] = e.target.value;
                          return { ...d, options: opts };
                        })}
                        placeholder={`Option ${["A","B","C","D"][i]}`}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                  Explanation <span className="font-normal">(optional — shown after answering)</span>
                </label>
                <input
                  value={draft.explanation}
                  onChange={(e) => setDraft((d) => ({ ...d, explanation: e.target.value }))}
                  placeholder="Why is this the correct answer?"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                />
              </div>
            </div>

            {addError && <p className="text-red-500 text-xs mt-3 font-medium">{addError}</p>}
            <button
              onClick={addManualQuestion}
              className="w-full mt-5 border-2 border-dashed border-[#002A5C]/30 text-[#002A5C] font-bold py-3 rounded-xl text-sm hover:border-[#002A5C] hover:bg-[#002A5C]/5 transition-all"
            >
              + Add Question
            </button>
          </div>

          {builtQs.length > 0 && (
            <button
              onClick={() => saveAndPreview(builtQs)}
              className="w-full bg-[#1a8c4e] text-white font-bold py-3.5 rounded-xl text-sm hover:bg-green-700 transition-colors"
            >
              Save Quiz & Get Share Code →
            </button>
          )}
        </div>
      </div>
    );
  }

  // -- new quiz view ----------------------------------------------------------
  if (view === "new") {
    return (
      <div className="min-h-screen bg-[#F4F6F9]">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
          <button onClick={() => setView("home")} className="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1.5 mb-6 transition-colors">← Back</button>
          <h1 className="text-2xl font-black text-black mb-6">Create a Quiz</h1>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5 mb-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Quiz Title</label>
              <input
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="e.g. MAT137 Limits & Derivatives"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Course Code <span className="font-normal normal-case text-gray-300">(optional)</span>
              </label>
              <input
                value={quizCourse}
                onChange={(e) => setQuizCourse(e.target.value)}
                placeholder="e.g. MAT137Y1"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">How do you want to make it?</label>
              <div className="grid grid-cols-2 gap-3">
                {(["manual", "ai"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setCreateMode(mode)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${createMode === mode ? "border-[#002A5C] bg-[#002A5C]/5" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <p className="text-sm font-black text-black mb-1">{mode === "manual" ? "Manual" : "AI Generate"}</p>
                    <p className="text-xs text-gray-400">
                      {mode === "manual" ? "Write your own questions and answers" : "Paste lecture notes — AI builds the quiz"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setView(createMode === "manual" ? "build-manual" : "build-ai")}
            disabled={!quizTitle.trim()}
            className="w-full bg-[#002A5C] text-white font-bold py-3.5 rounded-xl text-sm hover:bg-black transition-colors disabled:opacity-40"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // -- home view --------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <StudyQuizTabs active="quiz" />
      <div className="bg-[#002A5C] text-white py-14 px-6">
        <div className="max-w-4xl mx-auto flex items-end justify-between gap-4">
          <div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Quiz Bank</p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">Quizzes</h1>
            <p className="text-white/50 text-sm">Create quizzes manually or from lecture notes. Share with a 6-character code.</p>
          </div>
          <button
            onClick={() => { resetNew(); setView("new"); }}
            className="shrink-0 bg-[#F0B429] text-[#002A5C] font-black px-6 py-3 rounded-xl text-sm hover:bg-yellow-400 transition-colors"
          >
            + Create Quiz
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Join by code */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-8 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Join a Friend&apos;s Quiz</label>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && joinByCode()}
              placeholder="Enter share code"
              maxLength={6}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
            />
            {joinError && <p className="text-red-500 text-xs mt-1.5 font-medium">{joinError}</p>}
          </div>
          <button onClick={joinByCode} className="bg-[#002A5C] text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-black transition-colors shrink-0">
            Join
          </button>
        </div>

        {/* My quizzes */}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Your Quizzes</p>
        {myQuizzes.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
            <p className="text-gray-300 font-semibold text-sm mb-1">No quizzes yet</p>
            <p className="text-gray-300 text-xs">Create one manually or generate from your lecture notes.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {myQuizzes.map((q) => (
              <button
                key={q.id}
                onClick={() => { setActiveQuiz(q); setView("preview"); }}
                className="bg-white border border-gray-100 rounded-2xl p-5 text-left hover:border-[#002A5C]/30 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  {q.course ? (
                    <span className="bg-[#002A5C]/8 text-[#002A5C] text-xs font-bold px-2.5 py-1 rounded-lg font-mono">{q.course}</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-400 text-xs font-bold px-2.5 py-1 rounded-lg">No Course</span>
                  )}
                  <span className="font-mono text-xs font-bold text-gray-300 tracking-widest">{q.code}</span>
                </div>
                <h3 className="font-bold text-black text-sm mb-1 group-hover:text-[#002A5C] transition-colors leading-snug">{q.title}</h3>
                <p className="text-xs text-gray-400">{q.questions.length} questions · by {q.createdBy}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
