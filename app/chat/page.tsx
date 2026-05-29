"use client";

import { useEffect, useState } from "react";
import { getProfile, type Profile } from "@/lib/profile";
import Link from "next/link";

type Reply = { id: number; author: string; text: string; time: string };
type Post = {
  id: number;
  author: string;
  text: string;
  upvotes: number;
  downvotes: number;
  time: string;
  reported: boolean;
  replies: Reply[];
  voted: "up" | "down" | null;
  showReplies: boolean;
};
type Thread = { course: string; posts: Post[] };

const INITIAL_THREADS: Thread[] = [
  {
    course: "CSC108H1",
    posts: [
      {
        id: 1, author: "alex_cs",
        text: "Did anyone understand the recursion lecture? I keep getting lost on the base case.",
        upvotes: 12, downvotes: 2, time: "2h ago", reported: false, voted: null, showReplies: false,
        replies: [
          { id: 101, author: "maya_t", text: "Think of the base case as the condition that stops the recursion. Start there and work backwards.", time: "1h ago" },
        ],
      },
      {
        id: 2, author: "priya_s",
        text: "Reminder that office hours are today at 3pm in BA3200.",
        upvotes: 18, downvotes: 0, time: "3h ago", reported: false, voted: null, showReplies: false,
        replies: [],
      },
    ],
  },
  {
    course: "MAT137Y1",
    posts: [
      {
        id: 3, author: "james_w",
        text: "Midterm covers up to 4.3. Anyone want to form a study group this weekend?",
        upvotes: 21, downvotes: 1, time: "3h ago", reported: false, voted: null, showReplies: false,
        replies: [
          { id: 102, author: "leo_m", text: "I'm in! Saturday afternoon works for me.", time: "2h ago" },
        ],
      },
    ],
  },
  {
    course: "ECO101H1",
    posts: [
      {
        id: 4, author: "priya_s",
        text: "Prof's slides for week 6 are now on Quercus.",
        upvotes: 5, downvotes: 0, time: "30m ago", reported: false, voted: null, showReplies: false,
        replies: [],
      },
    ],
  },
];

export default function ChatPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);
  const [activeCourse, setActiveCourse] = useState("CSC108H1");
  const [newCourse, setNewCourse] = useState("");
  const [postText, setPostText] = useState("");
  const [search, setSearch] = useState("");
  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});
  const [sort, setSort] = useState<"top" | "new">("top");

  useEffect(() => { setProfile(getProfile()); }, []);

  const activeThread = threads.find((t) => t.course === activeCourse);
  const filtered = threads.filter((t) => t.course.includes(search.toUpperCase()));

  const visiblePosts = (activeThread?.posts ?? [])
    .filter((p) => !p.reported)
    .sort((a, b) =>
      sort === "top"
        ? (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
        : b.id - a.id
    );

  function updatePost(id: number, updater: (p: Post) => Post) {
    setThreads((prev) =>
      prev.map((t) =>
        t.course === activeCourse
          ? { ...t, posts: t.posts.map((p) => (p.id === id ? updater(p) : p)) }
          : t
      )
    );
  }

  function vote(postId: number, dir: "up" | "down") {
    updatePost(postId, (p) => {
      if (p.voted === dir) {
        return { ...p, voted: null, upvotes: dir === "up" ? p.upvotes - 1 : p.upvotes, downvotes: dir === "down" ? p.downvotes - 1 : p.downvotes };
      }
      const removeOld = p.voted === "up" ? { upvotes: p.upvotes - 1 } : p.voted === "down" ? { downvotes: p.downvotes - 1 } : {};
      const addNew = dir === "up" ? { upvotes: p.upvotes + 1 } : { downvotes: p.downvotes + 1 };
      return { ...p, ...removeOld, ...addNew, voted: dir };
    });
  }

  function addPost() {
    if (!postText.trim() || !profile) return;
    const post: Post = {
      id: Date.now(), author: profile.displayName, text: postText.trim(),
      upvotes: 0, downvotes: 0, time: "just now", reported: false,
      voted: null, showReplies: false, replies: [],
    };
    setThreads((prev) =>
      prev.map((t) => t.course === activeCourse ? { ...t, posts: [post, ...t.posts] } : t)
    );
    setPostText("");
  }

  function addReply(postId: number) {
    if (!replyInputs[postId]?.trim() || !profile) return;
    const reply: Reply = { id: Date.now(), author: profile.displayName, text: replyInputs[postId].trim(), time: "just now" };
    updatePost(postId, (p) => ({ ...p, replies: [...p.replies, reply], showReplies: true }));
    setReplyInputs((prev) => ({ ...prev, [postId]: "" }));
  }

  function toggleReplies(postId: number) {
    updatePost(postId, (p) => ({ ...p, showReplies: !p.showReplies }));
  }

  function report(postId: number) {
    updatePost(postId, (p) => ({ ...p, reported: true }));
  }

  function addThread() {
    const c = newCourse.trim().toUpperCase();
    if (!c || threads.find((t) => t.course === c)) return;
    setThreads([...threads, { course: c, posts: [] }]);
    setActiveCourse(c);
    setNewCourse("");
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-[#002A5C] text-white pt-14 pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Course Chat</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">Community Chat.</h1>
          <p className="text-white/50 text-lg">Profile-based threads for every course — with full accountability.</p>
        </div>
      </div>

    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      {/* Mobile course scroller */}
      <div className="md:hidden mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {threads.map((t) => (
            <button
              key={t.course}
              onClick={() => setActiveCourse(t.course)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                activeCourse === t.course ? "bg-[#002A5C] text-white" : "bg-white border border-gray-200 text-gray-600"
              }`}
            >
              {t.course}
            </button>
          ))}
          <div className="flex gap-1.5 shrink-0">
            <input
              value={newCourse}
              onChange={(e) => setNewCourse(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addThread()}
              placeholder="+ Add"
              className="w-20 border border-gray-200 rounded-xl px-2 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
            />
            <button onClick={addThread} className="bg-[#002A5C] text-white px-2 rounded-xl text-xs font-bold">+</button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-56 shrink-0">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Courses</p>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
        />
        <div className="space-y-0.5 mb-4">
          {filtered.map((t) => (
            <button
              key={t.course}
              onClick={() => setActiveCourse(t.course)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-between ${
                activeCourse === t.course ? "bg-[#002A5C] text-white font-semibold" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="font-mono">{t.course}</span>
              <span className={`text-xs ${activeCourse === t.course ? "text-white/50" : "text-gray-300"}`}>
                {t.posts.filter((p) => !p.reported).length}
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <input
            value={newCourse}
            onChange={(e) => setNewCourse(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addThread()}
            placeholder="Add course..."
            className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
          />
          <button onClick={addThread} className="bg-[#002A5C] text-white w-8 rounded-xl text-sm font-bold hover:bg-black transition-colors shrink-0">+</button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 mb-3 flex items-center justify-between">
          <div>
            <h1 className="font-black text-[#002A5C] text-lg font-mono">{activeCourse}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{visiblePosts.length} post{visiblePosts.length !== 1 ? "s" : ""} · cleared end of semester</p>
          </div>
          {/* Sort toggle */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {(["top", "new"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  sort === s ? "bg-white text-[#002A5C] shadow-sm" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {s === "top" ? "Top" : "New"}
              </button>
            ))}
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-3 mb-3">
          {visiblePosts.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl text-center py-16 text-gray-300">
              <p className="text-sm font-semibold">No posts yet — start the conversation</p>
            </div>
          ) : (
            visiblePosts.map((p) => {
              const score = p.upvotes - p.downvotes;
              return (
                <div key={p.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                  {/* Post header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#002A5C] text-white text-xs font-black flex items-center justify-center shrink-0">
                        {p.author[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-[#002A5C]">{p.author}</span>
                        <span className="text-xs text-gray-300 ml-2">{p.time}</span>
                      </div>
                    </div>
                    {profile && p.author !== profile.displayName && (
                      <button onClick={() => report(p.id)} className="text-xs text-gray-300 hover:text-red-400 transition-colors">
                        Report
                      </button>
                    )}
                  </div>

                  {/* Post body */}
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">{p.text}</p>

                  {/* Actions row */}
                  <div className="flex items-center gap-3">
                    {/* Vote */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                      <button
                        onClick={() => vote(p.id, "up")}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          p.voted === "up" ? "bg-[#1a8c4e] text-white" : "text-gray-500 hover:bg-white hover:text-[#1a8c4e]"
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        {p.upvotes}
                      </button>
                      <span className={`text-xs font-black px-1 min-w-[1.5rem] text-center ${score > 0 ? "text-[#1a8c4e]" : score < 0 ? "text-red-500" : "text-gray-400"}`}>
                        {score > 0 ? `+${score}` : score}
                      </span>
                      <button
                        onClick={() => vote(p.id, "down")}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          p.voted === "down" ? "bg-red-500 text-white" : "text-gray-500 hover:bg-white hover:text-red-500"
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {p.downvotes}
                      </button>
                    </div>

                    {/* Reply toggle */}
                    <button
                      onClick={() => toggleReplies(p.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#002A5C] transition-colors px-3 py-2 rounded-xl hover:bg-gray-100"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {p.replies.length > 0 ? `${p.replies.length} ${p.replies.length === 1 ? "reply" : "replies"}` : "Reply"}
                    </button>
                  </div>

                  {/* Replies section */}
                  {p.showReplies && (
                    <div className="mt-4 ml-4 border-l-2 border-gray-100 pl-4 space-y-3">
                      {p.replies.map((r) => (
                        <div key={r.id}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-lg bg-[#F0B429] text-[#002A5C] text-xs font-black flex items-center justify-center shrink-0">
                              {r.author[0].toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-[#002A5C]">{r.author}</span>
                            <span className="text-xs text-gray-300">{r.time}</span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed ml-8">{r.text}</p>
                        </div>
                      ))}

                      {/* Reply input */}
                      {profile ? (
                        <div className="flex gap-2 mt-2">
                          <input
                            value={replyInputs[p.id] ?? ""}
                            onChange={(e) => setReplyInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && addReply(p.id)}
                            placeholder="Write a reply…"
                            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                          />
                          <button
                            onClick={() => addReply(p.id)}
                            className="bg-[#002A5C] text-white px-4 rounded-xl text-xs font-bold hover:bg-black transition-colors"
                          >
                            Reply
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 mt-2">
                          <Link href="/profile" className="text-[#002A5C] font-semibold hover:underline">Create a profile</Link> to reply.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Post input */}
        {profile ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-3 items-start sticky bottom-4">
            <div className="w-9 h-9 rounded-xl bg-[#002A5C] text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
              {profile.displayName[0].toUpperCase()}
            </div>
            <div className="flex-1 flex gap-3">
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addPost(); } }}
                placeholder={`Post to ${activeCourse} as ${profile.displayName}…`}
                rows={2}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
              />
              <button
                onClick={addPost}
                disabled={!postText.trim()}
                className="bg-[#002A5C] text-white px-5 rounded-xl font-bold text-sm hover:bg-black transition-colors self-stretch disabled:opacity-40"
              >
                Post
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center">
            <p className="text-sm text-gray-500 mb-3">You need a profile to post in the community.</p>
            <Link href="/profile" className="inline-block bg-[#002A5C] text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-black transition-colors">
              Create Profile →
            </Link>
          </div>
        )}
      </div>
      </div>
    </div>
    </div>
  );
}
