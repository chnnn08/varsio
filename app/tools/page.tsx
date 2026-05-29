"use client";

import { useState } from "react";

// ── types ─────────────────────────────────────────────────────────────────────
type Deadline = { id: string; title: string; date: string; type: string; weight: string; course: string };
type Component = { id: string; name: string; weight: number; grade: number | null };

type Tab = "deadlines" | "grades";

// ── helpers ───────────────────────────────────────────────────────────────────
function urgencyColor(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "bg-gray-100 text-gray-500 border-gray-200";
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (days < 0) return "bg-gray-100 text-gray-400 border-gray-200";
  if (days <= 7) return "bg-red-50 text-red-600 border-red-200";
  if (days <= 14) return "bg-[#F0B429]/10 text-yellow-700 border-yellow-200";
  return "bg-green-50 text-green-700 border-green-200";
}

function urgencyLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (days < 0) return "Past due";
  if (days === 0) return "Due today";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return `${days} days left`;
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

const TYPE_COLORS: Record<string, string> = {
  exam: "bg-red-100 text-red-700",
  assignment: "bg-blue-100 text-[#002A5C]",
  quiz: "bg-yellow-100 text-yellow-700",
  project: "bg-purple-100 text-purple-700",
  other: "bg-gray-100 text-gray-600",
};

// ── component ──────────────────────────────────────────────────────────────────
export default function ToolsPage() {
  const [tab, setTab] = useState<Tab>("deadlines");

  // Deadlines state
  const [deadlines, setDeadlines] = useState<Deadline[]>([
    { id: "1", title: "Assignment 3", date: "2026-06-05", type: "assignment", weight: "10%", course: "CSC108H1" },
    { id: "2", title: "Midterm Exam", date: "2026-06-12", type: "exam", weight: "25%", course: "MAT137Y1" },
    { id: "3", title: "Lab Report 2", date: "2026-06-20", type: "assignment", weight: "5%", course: "CHM135H1" },
  ]);
  const [syllabus, setSyllabus] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ title: "", date: "", type: "assignment", weight: "", course: "" });

  // Grade calculator state
  const [courses, setCourses] = useState([
    {
      id: "c1", name: "CSC108H1", target: 80,
      components: [
        { id: "a1", name: "Assignment 1", weight: 10, grade: 85 },
        { id: "a2", name: "Assignment 2", weight: 10, grade: 78 },
        { id: "a3", name: "Midterm", weight: 30, grade: 72 },
        { id: "a4", name: "Final Exam", weight: 50, grade: null },
      ] as Component[],
    },
  ]);
  const [newCourseName, setNewCourseName] = useState("");

  // ── deadline functions ──────────────────────────────────────────────────────
  async function extractDeadlines() {
    if (!syllabus.trim()) { setExtractError("Paste your syllabus first."); return; }
    setExtracting(true); setExtractError("");
    try {
      const res = await fetch("/api/extract-deadlines", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syllabus }),
      });
      const data = await res.json();
      if (data.error) { setExtractError(data.error); return; }
      const newItems: Deadline[] = data.deadlines.map((d: Omit<Deadline, "id" | "course">) => ({
        ...d, id: crypto.randomUUID(), course: "",
      }));
      setDeadlines((prev) => [...newItems, ...prev]);
      setSyllabus("");
    } catch { setExtractError("Something went wrong. Try again."); }
    finally { setExtracting(false); }
  }

  function addManual() {
    if (!manualForm.title.trim() || !manualForm.date) return;
    setDeadlines((prev) => [{ ...manualForm, id: crypto.randomUUID() }, ...prev]);
    setManualForm({ title: "", date: "", type: "assignment", weight: "", course: "" });
    setShowManual(false);
  }

  function removeDeadline(id: string) {
    setDeadlines((prev) => prev.filter((d) => d.id !== id));
  }

  const sortedDeadlines = [...deadlines].sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    if (isNaN(da)) return 1;
    if (isNaN(db)) return -1;
    return da - db;
  });

  // ── grade functions ─────────────────────────────────────────────────────────
  function updateGrade(courseId: string, compId: string, val: string) {
    const n = val === "" ? null : Math.min(100, Math.max(0, parseFloat(val)));
    setCourses((prev) => prev.map((c) =>
      c.id === courseId
        ? { ...c, components: c.components.map((comp) => comp.id === compId ? { ...comp, grade: isNaN(n as number) ? null : n } : comp) }
        : c
    ));
  }

  function addCourse() {
    if (!newCourseName.trim()) return;
    setCourses((prev) => [...prev, {
      id: crypto.randomUUID(), name: newCourseName.trim().toUpperCase(), target: 80,
      components: [{ id: crypto.randomUUID(), name: "Final Exam", weight: 100, grade: null }],
    }]);
    setNewCourseName("");
  }

  function addComponent(courseId: string) {
    setCourses((prev) => prev.map((c) =>
      c.id === courseId
        ? { ...c, components: [...c.components, { id: crypto.randomUUID(), name: "New Component", weight: 0, grade: null }] }
        : c
    ));
  }

  function updateComponent(courseId: string, compId: string, field: keyof Component, val: string) {
    setCourses((prev) => prev.map((c) =>
      c.id === courseId
        ? { ...c, components: c.components.map((comp) => comp.id === compId ? { ...comp, [field]: field === "name" ? val : parseFloat(val) || 0 } : comp) }
        : c
    ));
  }

  function calcCurrentGrade(components: Component[]) {
    const done = components.filter((c) => c.grade !== null);
    if (done.length === 0) return null;
    const earned = done.reduce((s, c) => s + (c.grade! * c.weight) / 100, 0);
    const totalWeight = done.reduce((s, c) => s + c.weight, 0);
    return totalWeight > 0 ? (earned / totalWeight) * 100 : null;
  }

  function calcNeeded(components: Component[], target: number) {
    const done = components.filter((c) => c.grade !== null);
    const remaining = components.filter((c) => c.grade === null);
    if (remaining.length === 0) return null;
    const earned = done.reduce((s, c) => s + (c.grade! * c.weight) / 100, 0);
    const remainingWeight = remaining.reduce((s, c) => s + c.weight, 0);
    const needed = ((target - earned) / remainingWeight) * 100;
    return needed;
  }

  function gradeColor(g: number | null) {
    if (g === null) return "text-gray-400";
    if (g >= 80) return "text-[#1a8c4e]";
    if (g >= 60) return "text-[#F0B429]";
    return "text-red-500";
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      {/* Header */}
      <div className="bg-[#002A5C] text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Student Tools</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">Student Tools</h1>
          <p className="text-white/50 text-sm">Track deadlines and calculate your grades — all in one place.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white border border-gray-100 rounded-2xl p-1.5 w-fit">
          {([["deadlines", "Deadline Tracker"], ["grades", "Grade Calculator"]] as [Tab, string][]).map(([t, label]) => (
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

        {/* ── DEADLINE TRACKER ── */}
        {tab === "deadlines" && (
          <div className="space-y-4">
            {/* AI extraction */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h2 className="font-black text-black mb-1">AI Syllabus Scanner</h2>
              <p className="text-xs text-gray-400 mb-4">Paste your course syllabus and AI will extract all deadlines automatically.</p>
              <textarea
                value={syllabus}
                onChange={(e) => setSyllabus(e.target.value)}
                placeholder="Paste your syllabus here…"
                rows={5}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#002A5C] mb-3"
              />
              {extractError && <p className="text-red-500 text-xs mb-3 font-medium">{extractError}</p>}
              <div className="flex gap-3">
                <button
                  onClick={extractDeadlines}
                  disabled={extracting || !syllabus.trim()}
                  className="flex-1 bg-[#002A5C] text-white font-bold py-3 rounded-xl text-sm hover:bg-black transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {extracting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Scanning…</>
                  ) : "Extract Deadlines with AI"}
                </button>
                <button
                  onClick={() => setShowManual(!showManual)}
                  className="px-5 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm hover:border-gray-400 transition-colors"
                >
                  + Add Manually
                </button>
              </div>
            </div>

            {/* Manual form */}
            {showManual && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <h3 className="font-bold text-sm text-black mb-4">Add Deadline Manually</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input value={manualForm.title} onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })} placeholder="Title (e.g. Assignment 3)" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]" />
                  <input type="date" value={manualForm.date} onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]" />
                  <input value={manualForm.course} onChange={(e) => setManualForm({ ...manualForm, course: e.target.value.toUpperCase() })} placeholder="Course (e.g. CSC108H1)" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#002A5C]" />
                  <input value={manualForm.weight} onChange={(e) => setManualForm({ ...manualForm, weight: e.target.value })} placeholder="Weight (e.g. 20%)" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]" />
                </div>
                <div className="flex gap-2 mb-3">
                  {["assignment", "exam", "quiz", "project", "other"].map((t) => (
                    <button key={t} onClick={() => setManualForm({ ...manualForm, type: t })} className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${manualForm.type === t ? "bg-[#002A5C] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{t}</button>
                  ))}
                </div>
                <button onClick={addManual} className="w-full bg-[#1a8c4e] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-green-700 transition-colors">Add Deadline</button>
              </div>
            )}

            {/* Deadline list */}
            <div className="space-y-2">
              {sortedDeadlines.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl text-center py-14 text-gray-300">
                  <p className="text-3xl mb-2">📅</p>
                  <p className="text-sm">No deadlines yet — paste your syllabus above</p>
                </div>
              ) : (
                sortedDeadlines.map((d) => (
                  <div key={d.id} className={`bg-white border rounded-2xl px-5 py-4 flex items-center gap-4 ${urgencyColor(d.date)}`}>
                    <div className="shrink-0 text-center w-14">
                      <p className="text-xs font-black uppercase">{urgencyLabel(d.date)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-black truncate">{d.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {d.course && <span className="text-xs font-mono text-gray-400">{d.course}</span>}
                        {d.weight && <span className="text-xs text-gray-400">· {d.weight}</span>}
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${TYPE_COLORS[d.type] ?? TYPE_COLORS.other}`}>{d.type}</span>
                    <button onClick={() => removeDeadline(d.id)} className="text-gray-300 hover:text-red-400 transition-colors text-lg shrink-0">×</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── GRADE CALCULATOR ── */}
        {tab === "grades" && (
          <div className="space-y-4">
            {courses.map((course) => {
              const current = calcCurrentGrade(course.components);
              const needed = calcNeeded(course.components, course.target);
              const totalWeight = course.components.reduce((s, c) => s + c.weight, 0);

              return (
                <div key={course.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-black text-[#002A5C] font-mono">{course.name}</h2>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-semibold">Target</span>
                        <input
                          type="number"
                          value={course.target}
                          onChange={(e) => setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, target: parseFloat(e.target.value) || 0 } : c))}
                          className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                    <div className="px-5 py-4 text-center">
                      <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Current</p>
                      <p className={`text-2xl font-black ${gradeColor(current)}`}>
                        {current !== null ? `${current.toFixed(1)}%` : "—"}
                      </p>
                    </div>
                    <div className="px-5 py-4 text-center">
                      <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Needed</p>
                      <p className={`text-2xl font-black ${needed !== null ? gradeColor(needed) : "text-gray-300"}`}>
                        {needed !== null ? (needed > 100 ? "Impossible" : needed < 0 ? "Done!" : `${needed.toFixed(1)}%`) : "—"}
                      </p>
                    </div>
                    <div className="px-5 py-4 text-center">
                      <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Weight Used</p>
                      <p className={`text-2xl font-black ${totalWeight === 100 ? "text-[#1a8c4e]" : totalWeight > 100 ? "text-red-500" : "text-[#F0B429]"}`}>
                        {totalWeight}%
                      </p>
                    </div>
                  </div>

                  {/* Components */}
                  <div className="p-4 space-y-2">
                    {course.components.map((comp) => (
                      <div key={comp.id} className="flex items-center gap-3">
                        <input
                          value={comp.name}
                          onChange={(e) => updateComponent(course.id, comp.id, "name", e.target.value)}
                          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            value={comp.weight}
                            onChange={(e) => updateComponent(course.id, comp.id, "weight", e.target.value)}
                            className="w-14 border border-gray-200 rounded-xl px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                          />
                          <span className="text-xs text-gray-400">%</span>
                        </div>
                        <input
                          type="number"
                          value={comp.grade ?? ""}
                          onChange={(e) => updateGrade(course.id, comp.id, e.target.value)}
                          placeholder="Grade"
                          className={`w-20 border rounded-xl px-2 py-2 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-[#002A5C] ${comp.grade !== null ? gradeColor(comp.grade).replace("text-", "border-").replace("[#1a8c4e]", "green-300").replace("[#F0B429]", "yellow-300").replace("red-500", "red-300") : "border-gray-200"}`}
                        />
                        <button onClick={() => setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, components: c.components.filter((x) => x.id !== comp.id) } : c))} className="text-gray-300 hover:text-red-400 transition-colors">×</button>
                      </div>
                    ))}
                    <button onClick={() => addComponent(course.id)} className="text-xs text-[#002A5C] font-semibold hover:text-black transition-colors mt-1">+ Add component</button>
                  </div>
                </div>
              );
            })}

            {/* Add course */}
            <div className="flex gap-3">
              <input
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCourse()}
                placeholder="Add course (e.g. MAT137Y1)"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C] bg-white"
              />
              <button onClick={addCourse} className="bg-[#002A5C] text-white font-bold px-5 rounded-xl text-sm hover:bg-black transition-colors">
                Add Course
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
