"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getProfile, type Profile } from "@/lib/profile";
import { getConvo, sendDM, getConvoPartners, getLastMessage, type Message } from "@/lib/messages";
import Link from "next/link";

function fmt(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function MessagesInner() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partners, setPartners] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [convo, setConvo] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const newRef = useRef<HTMLInputElement>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const p = getProfile();
    if (!p) { router.push("/profile"); return; }
    setProfile(p);

    const saved = getConvoPartners(p.displayName);
    const withParam = searchParams.get("with");

    let all = [...saved];
    if (withParam) {
      const idx = all.findIndex((n) => n.toLowerCase() === withParam.toLowerCase());
      if (idx >= 0) all.splice(idx, 1);
      all = [withParam, ...all];
    }
    setPartners(all);

    const target = withParam ?? all[0] ?? null;
    if (target) {
      setActive(target);
      setConvo(getConvo(p.displayName, target));
      if (withParam) setMobileView("thread");
    }
  }, [searchParams, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convo]);

  function openConvo(name: string) {
    if (!profile) return;
    setActive(name);
    setConvo(getConvo(profile.displayName, name));
    setPartners((prev) => {
      const without = prev.filter((n) => n.toLowerCase() !== name.toLowerCase());
      return [name, ...without];
    });
    setMobileView("thread");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleSend() {
    if (!input.trim() || !profile || !active) return;
    sendDM(profile.displayName, active, input.trim());
    setConvo(getConvo(profile.displayName, active));
    setPartners((prev) => {
      const without = prev.filter((n) => n.toLowerCase() !== active.toLowerCase());
      return [active, ...without];
    });
    setInput("");
  }

  function startNew() {
    const name = newName.trim();
    if (!name || name.toLowerCase() === profile?.displayName.toLowerCase()) return;
    setNewName("");
    setShowNew(false);
    openConvo(name);
  }

  if (!profile) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <aside
        className={`${
          mobileView === "thread" ? "hidden" : "flex"
        } md:flex flex-col w-full md:w-72 shrink-0 bg-white border-r border-gray-200`}
      >
        {/* Sidebar header */}
        <div className="px-4 pt-5 pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-black text-black">Messages</h1>
            <button
              onClick={() => { setShowNew(!showNew); setTimeout(() => newRef.current?.focus(), 50); }}
              className="w-8 h-8 bg-[#002A5C] hover:bg-black text-white rounded-lg flex items-center justify-center text-lg font-bold transition-colors"
              title="New message"
            >
              +
            </button>
          </div>
          {showNew && (
            <div className="flex gap-2">
              <input
                ref={newRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") startNew();
                  if (e.key === "Escape") setShowNew(false);
                }}
                placeholder="Display name..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
              />
              <button
                onClick={startNew}
                className="bg-[#002A5C] text-white px-3 rounded-xl text-xs font-bold hover:bg-black transition-colors"
              >
                Go
              </button>
            </div>
          )}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {partners.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-400 mb-1">No messages yet</p>
              <p className="text-xs text-gray-300 leading-relaxed">
                Visit someone&apos;s profile and hit Message to start a conversation.
              </p>
            </div>
          ) : (
            partners.map((name) => {
              const last = getLastMessage(profile.displayName, name);
              const isActive = active?.toLowerCase() === name.toLowerCase();
              return (
                <button
                  key={name}
                  onClick={() => openConvo(name)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-gray-50 transition-colors ${
                    isActive
                      ? "bg-[#002A5C]/5 border-l-2 border-l-[#002A5C]"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#002A5C] text-white text-xs font-black flex items-center justify-center shrink-0">
                    {initials(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`text-sm font-bold truncate ${isActive ? "text-[#002A5C]" : "text-black"}`}>
                        {name}
                      </p>
                      {last && (
                        <span className="text-[10px] text-gray-300 shrink-0">{fmt(last.ts)}</span>
                      )}
                    </div>
                    {last && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {last.from === profile.displayName ? "You: " : ""}
                        {last.text}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── THREAD ──────────────────────────────────────────────── */}
      {active ? (
        <main
          className={`${
            mobileView === "list" ? "hidden" : "flex"
          } md:flex flex-1 flex-col bg-[#F4F6F9] min-w-0`}
        >
          {/* Thread header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
            <button
              onClick={() => setMobileView("list")}
              className="md:hidden text-gray-400 hover:text-gray-700 mr-1 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-9 h-9 rounded-full bg-[#002A5C] text-white text-xs font-black flex items-center justify-center shrink-0">
              {initials(active)}
            </div>
            <div className="flex-1 min-w-0">
              <Link
                href={`/profile/${encodeURIComponent(active)}`}
                className="font-bold text-black hover:text-[#002A5C] transition-colors text-sm leading-tight block truncate"
              >
                {active}
              </Link>
              <p className="text-xs text-gray-400">Direct message</p>
            </div>
            <Link
              href={`/profile/${encodeURIComponent(active)}`}
              className="text-xs font-semibold text-[#002A5C] hover:underline shrink-0"
            >
              View profile
            </Link>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {convo.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-[#002A5C] text-white font-black text-xl flex items-center justify-center mx-auto mb-4">
                    {initials(active)}
                  </div>
                  <p className="font-black text-black mb-1">{active}</p>
                  <p className="text-sm text-gray-400">Say something to kick things off.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {convo.map((msg, i) => {
                  const isMe = msg.from.toLowerCase() === profile.displayName.toLowerCase();
                  const prev = convo[i - 1];
                  const next = convo[i + 1];
                  const groupedWithPrev = prev && prev.from === msg.from;
                  const groupedWithNext = next && next.from === msg.from;
                  const showTime = !next || next.ts - msg.ts > 5 * 60 * 1000;

                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} ${groupedWithPrev ? "mt-0.5" : "mt-3"}`}>
                      <div className={`max-w-[72%] sm:max-w-[60%]`}>
                        {!isMe && !groupedWithPrev && (
                          <p className="text-xs font-bold text-gray-400 mb-1 ml-1">{msg.from}</p>
                        )}
                        <div
                          className={`px-4 py-2.5 text-sm leading-relaxed break-words ${
                            isMe
                              ? `bg-[#002A5C] text-white ${
                                  groupedWithNext ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-br-sm"
                                } ${groupedWithPrev ? "rounded-tr-md" : ""}`
                              : `bg-white border border-gray-100 text-gray-800 shadow-sm ${
                                  groupedWithNext ? "rounded-2xl rounded-bl-md" : "rounded-2xl rounded-bl-sm"
                                } ${groupedWithPrev ? "rounded-tl-md" : ""}`
                          }`}
                        >
                          {msg.text}
                        </div>
                        {showTime && (
                          <p className={`text-[10px] text-gray-300 mt-1 ${isMe ? "text-right mr-1" : "ml-1"}`}>
                            {fmt(msg.ts)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
            {convo.length === 0 && <div ref={bottomRef} />}
          </div>

          {/* Input bar */}
          <div className="bg-white border-t border-gray-200 px-4 py-3 flex gap-3 items-end shrink-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder={`Message ${active}...`}
              rows={1}
              className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
              style={{ minHeight: "42px", maxHeight: "128px" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-10 h-10 bg-[#002A5C] text-white rounded-full flex items-center justify-center hover:bg-black transition-colors disabled:opacity-40 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </main>
      ) : (
        <main
          className={`${
            mobileView === "list" ? "hidden" : "flex"
          } md:flex flex-1 items-center justify-center bg-[#F4F6F9]`}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="font-bold text-gray-500 mb-1">Pick a conversation</p>
            <p className="text-sm text-gray-400">or start a new one with the + button</p>
          </div>
        </main>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesInner />
    </Suspense>
  );
}
