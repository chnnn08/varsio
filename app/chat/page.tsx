"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getProfile, type Profile } from "@/lib/profile";
import { getConvo, sendDM, getConvoPartners, getLastMessage, type Message as DM } from "@/lib/messages";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { track } from "@vercel/analytics";

type Reply = { id: string; author: string; text: string; time: string };
type Post = {
  id: string;
  author: string;
  text: string;
  upvotes: number;
  downvotes: number;
  time: string;
  reported: boolean;
  replies: Reply[];
  voted: "up" | "down" | null;
  showReplies: boolean;
  isDemo?: boolean;
};
type Thread = { course: string; posts: Post[] };
type MentionState = { active: string; query: string } | null;

function formatTime(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

async function loadCoursePostsFromDB(course: string): Promise<Post[]> {
  const { data: posts } = await supabase
    .from("chat_posts")
    .select("*")
    .eq("course", course)
    .order("created_at", { ascending: false })
    .limit(50);
  if (!posts || posts.length === 0) return [];
  const postIds = posts.map((p) => p.id as string);
  const { data: replies } = await supabase
    .from("chat_replies")
    .select("*")
    .in("post_id", postIds)
    .order("created_at", { ascending: true });
  return posts.map((p) => ({
    id: p.id as string,
    author: p.author as string,
    text: p.text as string,
    upvotes: (p.upvotes as number) ?? 0,
    downvotes: (p.downvotes as number) ?? 0,
    time: formatTime(new Date(p.created_at as string)),
    reported: (p.reported as boolean) ?? false,
    voted: null,
    showReplies: false,
    replies: (replies ?? [])
      .filter((r) => r.post_id === p.id)
      .map((r) => ({
        id: r.id as string,
        author: r.author as string,
        text: r.text as string,
        time: formatTime(new Date(r.created_at as string)),
      })),
  }));
}

const INITIAL_THREADS: Thread[] = [
  {
    course: "CSC108H1",
    posts: [
      {
        id: "demo-1", isDemo: true, author: "alex_cs",
        text: "Did anyone understand the recursion lecture? I keep getting lost on the base case.",
        upvotes: 12, downvotes: 2, time: "2h ago", reported: false, voted: null, showReplies: false,
        replies: [
          { id: "demo-101", author: "maya_t", text: "Think of the base case as the condition that stops the recursion. Start there and work backwards.", time: "1h ago" },
        ],
      },
      {
        id: "demo-2", isDemo: true, author: "priya_s",
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
        id: "demo-3", isDemo: true, author: "james_w",
        text: "Midterm covers up to 4.3. Anyone want to form a study group this weekend?",
        upvotes: 21, downvotes: 1, time: "3h ago", reported: false, voted: null, showReplies: false,
        replies: [
          { id: "demo-102", author: "leo_m", text: "I'm in! Saturday afternoon works for me.", time: "2h ago" },
        ],
      },
    ],
  },
  {
    course: "ECO101H1",
    posts: [
      {
        id: "demo-4", isDemo: true, author: "priya_s",
        text: "Prof's slides for week 6 are now on Quercus.",
        upvotes: 5, downvotes: 0, time: "30m ago", reported: false, voted: null, showReplies: false,
        replies: [],
      },
    ],
  },
];

function fmtDM(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function dmInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function TextWithMentions({ text, myName }: { text: string; myName?: string }) {
  const parts = text.split(/(@\w+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (/^@\w+$/.test(part)) {
          const name = part.slice(1);
          const isMe = myName && name.toLowerCase() === myName.toLowerCase();
          return (
            <Link
              key={i}
              href={`/profile/${encodeURIComponent(name)}`}
              className={`font-bold rounded ${
                isMe ? "text-[#F0B429] bg-[#F0B429]/15 px-0.5" : "text-[#002A5C] hover:underline"
              }`}
            >
              {part}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function MentionDropdown({ suggestions, onSelect }: { suggestions: string[]; onSelect: (name: string) => void }) {
  if (suggestions.length === 0) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-40 z-30">
      {suggestions.map((name) => (
        <button
          key={name}
          onMouseDown={(e) => { e.preventDefault(); onSelect(name); }}
          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 font-semibold text-[#002A5C] flex items-center gap-2"
        >
          <span className="w-5 h-5 rounded-full bg-[#002A5C] text-white text-[10px] font-black flex items-center justify-center shrink-0">
            {name[0].toUpperCase()}
          </span>
          @{name}
        </button>
      ))}
    </div>
  );
}

function ChatInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // -- page tab --
  const [activeTab, setActiveTab] = useState<"chat" | "dm">("chat");

  // -- chat state --
  const [profile, setProfile] = useState<Profile | null>(null);
  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);
  const [activeCourse, setActiveCourse] = useState("CSC108H1");
  const [newCourse, setNewCourse] = useState("");
  const [postText, setPostText] = useState("");
  const [search, setSearch] = useState("");
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<"top" | "new">("top");
  const [linkCopied, setLinkCopied] = useState(false);
  const [mention, setMention] = useState<MentionState>(null);
  const postRef = useRef<HTMLTextAreaElement>(null);

  // -- dm state --
  const [dmPartners, setDmPartners] = useState<string[]>([]);
  const [dmActive, setDmActive] = useState<string | null>(null);
  const [dmConvo, setDmConvo] = useState<DM[]>([]);
  const [dmInput, setDmInput] = useState("");
  const [showNewDM, setShowNewDM] = useState(false);
  const [newDMName, setNewDMName] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const [lastMessages, setLastMessages] = useState<Record<string, DM | null>>({});
  const [dmUnread, setDmUnread] = useState(0);
  const dmBottomRef = useRef<HTMLDivElement>(null);
  const dmInputRef = useRef<HTMLTextAreaElement>(null);
  const newDMRef = useRef<HTMLInputElement>(null);
  const dmActiveRef = useRef<string | null>(null);
  dmActiveRef.current = dmActive;

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      const p = user ? await getProfile() : null;
      setProfile(p);

      if (searchParams.get("tab") === "dm") setActiveTab("dm");

      const course = searchParams.get("course");
      if (course) {
        const found = INITIAL_THREADS.find((t) => t.course === course.toUpperCase());
        if (found) setActiveCourse(found.course);
        else {
          setThreads((prev) => {
            if (prev.find((t) => t.course === course.toUpperCase())) return prev;
            return [...prev, { course: course.toUpperCase(), posts: [] }];
          });
          setActiveCourse(course.toUpperCase());
        }
      }

      if (p) {
        const saved = await getConvoPartners(p.displayName);
        const withParam = searchParams.get("with");
        let all = [...saved];
        if (withParam) {
          const idx = all.findIndex((n) => n.toLowerCase() === withParam.toLowerCase());
          if (idx >= 0) all.splice(idx, 1);
          all = [withParam, ...all];
        }
        setDmPartners(all);
        const lasts: Record<string, DM | null> = {};
        await Promise.all(all.map(async (n) => { lasts[n] = await getLastMessage(p.displayName, n); }));
        setLastMessages(lasts);
        const target = withParam ?? all[0] ?? null;
        if (target) {
          setDmActive(target);
          setDmConvo(await getConvo(p.displayName, target));
          if (withParam) setMobileView("thread");
        }
      }
    }
    init();
  }, [searchParams]);

  useEffect(() => {
    dmBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dmConvo]);

  // Load DB posts whenever the active course changes
  useEffect(() => {
    loadCoursePostsFromDB(activeCourse).then((dbPosts) => {
      if (dbPosts.length === 0) return;
      setThreads((prev) => {
        const has = prev.find((t) => t.course === activeCourse);
        if (has) return prev.map((t) => t.course === activeCourse ? { ...t, posts: dbPosts } : t);
        return [...prev, { course: activeCourse, posts: dbPosts }];
      });
    });
  }, [activeCourse]);

  // Real-time incoming DM subscription
  useEffect(() => {
    if (!profile) return;
    const myNameL = profile.displayName.toLowerCase();
    const channel = supabase
      .channel("incoming-dms")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const row = payload.new as Record<string, unknown>;
        if ((row.to_user as string).toLowerCase() !== myNameL) return;
        const fromUser = row.from_user as string;
        const msg: DM = {
          id: row.id as string,
          from: fromUser,
          to: row.to_user as string,
          text: row.text as string,
          ts: new Date(row.created_at as string).getTime(),
        };
        if (dmActiveRef.current?.toLowerCase() === fromUser.toLowerCase()) {
          setDmConvo((prev) => [...prev, msg]);
        } else {
          setDmUnread((prev) => prev + 1);
        }
        setLastMessages((prev) => ({ ...prev, [fromUser]: msg }));
        setDmPartners((prev) => {
          const without = prev.filter((n) => n.toLowerCase() !== fromUser.toLowerCase());
          return [fromUser, ...without];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  // -- chat helpers --
  function copyLink() {
    const url = `${window.location.origin}/chat?course=${activeCourse}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  const activeThread = threads.find((t) => t.course === activeCourse);
  const filtered = threads.filter((t) => t.course.includes(search.toUpperCase()));
  const visiblePosts = (activeThread?.posts ?? [])
    .filter((p) => !p.reported)
    .sort((a, b) => sort === "top" ? (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes) : b.id - a.id);

  function getSuggestions(query: string): string[] {
    const friends = profile?.connections ?? [];
    const threadNames = [
      ...new Set([
        ...visiblePosts.map((p) => p.author),
        ...visiblePosts.flatMap((p) => p.replies.map((r) => r.author)),
      ]),
    ].filter((a) => a !== profile?.displayName);
    const pool = [...new Set([...friends, ...threadNames])];
    const q = query.toLowerCase();
    return pool.filter((n) => !q || n.toLowerCase().includes(q)).slice(0, 6);
  }

  function detectMention(text: string, active: "post" | number) {
    const match = text.match(/@(\w*)$/);
    if (match) setMention({ active, query: match[1] });
    else if (mention) setMention(null);
  }

  function insertMention(name: string) {
    if (!mention) return;
    if (mention.active === "post") {
      const ta = postRef.current;
      const cursor = ta?.selectionStart ?? postText.length;
      const before = postText.slice(0, cursor).replace(/@\w*$/, `@${name} `);
      const after = postText.slice(cursor);
      setPostText(before + after);
    } else {
      const id = mention.active as number;
      const cur = replyInputs[id] ?? "";
      setReplyInputs((prev) => ({ ...prev, [id]: cur.replace(/@\w*$/, `@${name} `) }));
    }
    setMention(null);
  }

  function updatePost(id: string, updater: (p: Post) => Post) {
    setThreads((prev) =>
      prev.map((t) =>
        t.course === activeCourse ? { ...t, posts: t.posts.map((p) => (p.id === id ? updater(p) : p)) } : t
      )
    );
  }

  function vote(postId: string, dir: "up" | "down") {
    const post = threads.flatMap((t) => t.posts).find((p) => p.id === postId);
    if (!post) return;
    let up = post.upvotes, down = post.downvotes;
    let newVoted: "up" | "down" | null;
    if (post.voted === dir) {
      if (dir === "up") up--; else down--;
      newVoted = null;
    } else {
      if (post.voted === "up") up--;
      if (post.voted === "down") down--;
      if (dir === "up") up++; else down++;
      newVoted = dir;
    }
    updatePost(postId, (p) => ({ ...p, voted: newVoted, upvotes: up, downvotes: down }));
    if (!post.isDemo) {
      supabase.from("chat_posts").update({ upvotes: up, downvotes: down }).eq("id", postId);
    }
  }

  async function addPost() {
    if (!postText.trim() || !profile) return;
    track("post_created", { course: activeCourse });
    const text = postText.trim();
    setPostText("");
    setMention(null);
    const { data } = await supabase.from("chat_posts").insert({
      course: activeCourse,
      author: profile.displayName,
      text,
      upvotes: 0,
      downvotes: 0,
    }).select().single();
    const post: Post = {
      id: data?.id ?? `local-${Date.now()}`,
      author: profile.displayName,
      text,
      upvotes: 0, downvotes: 0,
      time: "just now",
      reported: false, voted: null, showReplies: false, replies: [],
      isDemo: !data,
    };
    setThreads((prev) =>
      prev.map((t) => t.course === activeCourse ? { ...t, posts: [post, ...t.posts] } : t)
    );
  }

  async function addReply(postId: string) {
    if (!replyInputs[postId]?.trim() || !profile) return;
    const text = replyInputs[postId].trim();
    const post = threads.flatMap((t) => t.posts).find((p) => p.id === postId);
    if (!post?.isDemo) {
      await supabase.from("chat_replies").insert({ post_id: postId, author: profile.displayName, text });
    }
    const reply: Reply = { id: `local-${Date.now()}`, author: profile.displayName, text, time: "just now" };
    updatePost(postId, (p) => ({ ...p, replies: [...p.replies, reply], showReplies: true }));
    setReplyInputs((prev) => ({ ...prev, [postId]: "" }));
    setMention(null);
  }

  function replyTo(postId: string, author: string) {
    updatePost(postId, (p) => ({ ...p, showReplies: true }));
    setReplyInputs((prev) => {
      const existing = prev[postId] ?? "";
      if (existing.includes(`@${author}`)) return prev;
      return { ...prev, [postId]: `@${author} ` };
    });
  }

  function toggleReplies(postId: string) {
    updatePost(postId, (p) => ({ ...p, showReplies: !p.showReplies }));
  }

  function report(postId: string) {
    updatePost(postId, (p) => ({ ...p, reported: true }));
    const post = threads.flatMap((t) => t.posts).find((p) => p.id === postId);
    if (!post?.isDemo) {
      supabase.from("chat_posts").update({ reported: true }).eq("id", postId);
    }
  }

  async function addThread() {
    const c = newCourse.trim().toUpperCase();
    if (!c || threads.find((t) => t.course === c)) return;
    setNewCourse("");
    const dbPosts = await loadCoursePostsFromDB(c);
    setThreads((prev) => [...prev, { course: c, posts: dbPosts }]);
    setActiveCourse(c);
  }

  // -- dm helpers --
  async function openDMConvo(name: string) {
    if (!profile) return;
    setDmActive(name);
    setDmConvo(await getConvo(profile.displayName, name));
    setDmPartners((prev) => {
      const without = prev.filter((n) => n.toLowerCase() !== name.toLowerCase());
      return [name, ...without];
    });
    setMobileView("thread");
    setTimeout(() => dmInputRef.current?.focus(), 50);
  }

  async function handleDMSend() {
    if (!dmInput.trim() || !profile || !dmActive) return;
    track("dm_sent");
    await sendDM(profile.displayName, dmActive, dmInput.trim());
    const [convo, last] = await Promise.all([
      getConvo(profile.displayName, dmActive),
      getLastMessage(profile.displayName, dmActive),
    ]);
    setDmConvo(convo);
    setLastMessages((prev) => ({ ...prev, [dmActive]: last }));
    setDmPartners((prev) => {
      const without = prev.filter((n) => n.toLowerCase() !== dmActive.toLowerCase());
      return [dmActive, ...without];
    });
    setDmInput("");
  }

  async function startNewDM() {
    const name = newDMName.trim();
    if (!name || name.toLowerCase() === profile?.displayName.toLowerCase()) return;
    setNewDMName("");
    setShowNewDM(false);
    await openDMConvo(name);
  }

  return (
    <div>
      {/* Page tab bar */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all ${
              activeTab === "chat" ? "border-[#002A5C] text-[#002A5C]" : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            Course Chat
          </button>
          <button
            onClick={() => { setActiveTab("dm"); setDmUnread(0); }}
            className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "dm" ? "border-[#002A5C] text-[#002A5C]" : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            Direct Messages
            {dmUnread > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                {dmUnread > 9 ? "9+" : dmUnread}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── COURSE CHAT ───────────────────────────────────────── */}
      {activeTab === "chat" && (
        <div>
          <div className="bg-[#002A5C] text-white pt-14 pb-16 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Course Chat</p>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">Community Chat.</h1>
              <p className="text-white/50 text-lg">Profile-based threads for every course, with full accountability.</p>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
            <div className="md:hidden mb-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
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

              <div className="flex-1 min-w-0">
                <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 mb-3 flex items-center justify-between">
                  <div>
                    <h1 className="font-black text-[#002A5C] text-lg font-mono">{activeCourse}</h1>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {visiblePosts.length} post{visiblePosts.length !== 1 ? "s" : ""} &middot; cleared end of semester
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyLink}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${linkCopied ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                    >
                      {linkCopied ? "Copied!" : "Share"}
                    </button>
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
                </div>

                <div className="space-y-3 mb-3">
                  {visiblePosts.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-2xl text-center py-16 text-gray-300">
                      <p className="text-sm font-semibold">No posts yet - start the conversation</p>
                    </div>
                  ) : (
                    visiblePosts.map((p) => {
                      const score = p.upvotes - p.downvotes;
                      return (
                        <div key={p.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/profile/${encodeURIComponent(p.author)}`}
                                className="w-8 h-8 rounded-xl bg-[#002A5C] text-white text-xs font-black flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
                              >
                                {p.author[0].toUpperCase()}
                              </Link>
                              <div>
                                <Link href={`/profile/${encodeURIComponent(p.author)}`} className="text-sm font-bold text-[#002A5C] hover:underline">
                                  {p.author}
                                </Link>
                                <span className="text-xs text-gray-300 ml-2">{p.time}</span>
                              </div>
                            </div>
                            {profile && p.author !== profile.displayName && (
                              <button onClick={() => report(p.id)} className="text-xs text-gray-300 hover:text-red-400 transition-colors">
                                Report
                              </button>
                            )}
                          </div>

                          <p className="text-sm text-gray-700 leading-relaxed mb-4">
                            <TextWithMentions text={p.text} myName={profile?.displayName} />
                          </p>

                          <div className="flex items-center gap-3">
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

                            <button
                              onClick={() => toggleReplies(p.id)}
                              className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#002A5C] transition-colors px-3 py-2 rounded-xl hover:bg-gray-100"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              {p.replies.length > 0 ? `${p.replies.length} ${p.replies.length === 1 ? "reply" : "replies"}` : "Replies"}
                            </button>

                            {profile && p.author !== profile.displayName && (
                              <button
                                onClick={() => replyTo(p.id, p.author)}
                                className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#002A5C] transition-colors px-3 py-2 rounded-xl hover:bg-gray-100"
                              >
                                @ Reply
                              </button>
                            )}
                          </div>

                          {p.showReplies && (
                            <div className="mt-4 ml-4 border-l-2 border-gray-100 pl-4 space-y-3">
                              {p.replies.map((r) => (
                                <div key={r.id}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Link
                                      href={`/profile/${encodeURIComponent(r.author)}`}
                                      className="w-6 h-6 rounded-lg bg-[#F0B429] text-[#002A5C] text-xs font-black flex items-center justify-center shrink-0 hover:opacity-80"
                                    >
                                      {r.author[0].toUpperCase()}
                                    </Link>
                                    <Link href={`/profile/${encodeURIComponent(r.author)}`} className="text-xs font-bold text-[#002A5C] hover:underline">
                                      {r.author}
                                    </Link>
                                    <span className="text-xs text-gray-300">{r.time}</span>
                                  </div>
                                  <p className="text-sm text-gray-600 leading-relaxed ml-8">
                                    <TextWithMentions text={r.text} myName={profile?.displayName} />
                                  </p>
                                </div>
                              ))}

                              {profile ? (
                                <div className="relative mt-2">
                                  <div className="flex gap-2">
                                    <input
                                      value={replyInputs[p.id] ?? ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setReplyInputs((prev) => ({ ...prev, [p.id]: val }));
                                        detectMention(val, p.id);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Escape") { setMention(null); return; }
                                        if (e.key === "Enter") addReply(p.id);
                                      }}
                                      onBlur={() => setTimeout(() => setMention(null), 150)}
                                      placeholder={`Reply as ${profile.displayName}... (use @ to mention)`}
                                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                                    />
                                    <button
                                      onClick={() => addReply(p.id)}
                                      className="bg-[#002A5C] text-white px-4 rounded-xl text-xs font-bold hover:bg-black transition-colors"
                                    >
                                      Reply
                                    </button>
                                  </div>
                                  {mention?.active === p.id && (
                                    <div className="absolute top-full mt-1 left-0">
                                      <MentionDropdown suggestions={getSuggestions(mention.query)} onSelect={(name) => insertMention(name)} />
                                    </div>
                                  )}
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

                {profile ? (
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-3 items-start sticky bottom-4">
                    <div className="w-9 h-9 rounded-xl bg-[#002A5C] text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      {profile.displayName[0].toUpperCase()}
                    </div>
                    <div className="flex-1 relative">
                      {mention?.active === "post" && (
                        <div className="absolute bottom-full mb-2 left-0">
                          <MentionDropdown suggestions={getSuggestions(mention.query)} onSelect={(name) => insertMention(name)} />
                        </div>
                      )}
                      <div className="flex gap-3">
                        <textarea
                          ref={postRef}
                          value={postText}
                          onChange={(e) => {
                            setPostText(e.target.value);
                            detectMention(e.target.value, "post");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") { setMention(null); return; }
                            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addPost(); }
                          }}
                          onBlur={() => setTimeout(() => setMention(null), 150)}
                          placeholder={`Post to ${activeCourse} as ${profile.displayName}... (use @ to mention someone)`}
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
                      <p className="text-xs text-gray-300 mt-1.5">Type @ to mention a friend or classmate</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center">
                    <p className="text-sm text-gray-500 mb-3">You need a profile to post in the community.</p>
                    <Link href="/profile" className="inline-block bg-[#002A5C] text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-black transition-colors">
                      Create Profile &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DIRECT MESSAGES ───────────────────────────────────── */}
      {activeTab === "dm" && (
        <div className="flex overflow-hidden" style={{ height: "calc(100vh - 4rem - 46px)" }}>

          {/* Sidebar */}
          <aside
            className={`${mobileView === "thread" ? "hidden" : "flex"} md:flex flex-col w-full md:w-72 shrink-0 bg-white border-r border-gray-200`}
          >
            <div className="px-4 pt-5 pb-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-black text-black">Messages</h2>
                <button
                  onClick={() => { setShowNewDM(!showNewDM); setTimeout(() => newDMRef.current?.focus(), 50); }}
                  className="w-8 h-8 bg-[#002A5C] hover:bg-black text-white rounded-lg flex items-center justify-center text-lg font-bold transition-colors"
                  title="New message"
                >
                  +
                </button>
              </div>
              {showNewDM && (
                <div className="flex gap-2">
                  <input
                    ref={newDMRef}
                    value={newDMName}
                    onChange={(e) => setNewDMName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") startNewDM();
                      if (e.key === "Escape") setShowNewDM(false);
                    }}
                    placeholder="Display name..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                  />
                  <button onClick={startNewDM} className="bg-[#002A5C] text-white px-3 rounded-xl text-xs font-bold hover:bg-black transition-colors">
                    Go
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {dmPartners.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-400 mb-1">No messages yet</p>
                  <p className="text-xs text-gray-300 leading-relaxed">Visit someone&apos;s profile and hit Message to start a conversation.</p>
                </div>
              ) : (
                dmPartners.map((name) => {
                  const last = lastMessages[name] ?? null;
                  const isActive = dmActive?.toLowerCase() === name.toLowerCase();
                  return (
                    <button
                      key={name}
                      onClick={() => openDMConvo(name)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-gray-50 transition-colors ${
                        isActive ? "bg-[#002A5C]/5 border-l-2 border-l-[#002A5C]" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#002A5C] text-white text-xs font-black flex items-center justify-center shrink-0">
                        {dmInitials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className={`text-sm font-bold truncate ${isActive ? "text-[#002A5C]" : "text-black"}`}>{name}</p>
                          {last && <span className="text-[10px] text-gray-300 shrink-0">{fmtDM(last.ts)}</span>}
                        </div>
                        {last && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {last.from === profile?.displayName ? "You: " : ""}{last.text}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Thread */}
          {dmActive ? (
            <main className={`${mobileView === "list" ? "hidden" : "flex"} md:flex flex-1 flex-col bg-[#F4F6F9] min-w-0`}>
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
                  {dmInitials(dmActive)}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/profile/${encodeURIComponent(dmActive)}`}
                    className="font-bold text-black hover:text-[#002A5C] transition-colors text-sm leading-tight block truncate"
                  >
                    {dmActive}
                  </Link>
                  <p className="text-xs text-gray-400">Direct message</p>
                </div>
                <Link
                  href={`/profile/${encodeURIComponent(dmActive)}`}
                  className="text-xs font-semibold text-[#002A5C] hover:underline shrink-0"
                >
                  View profile
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                {dmConvo.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-[#002A5C] text-white font-black text-xl flex items-center justify-center mx-auto mb-4">
                        {dmInitials(dmActive)}
                      </div>
                      <p className="font-black text-black mb-1">{dmActive}</p>
                      <p className="text-sm text-gray-400">Say something to kick things off.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {dmConvo.map((msg, i) => {
                      const isMe = msg.from.toLowerCase() === profile?.displayName.toLowerCase();
                      const prev = dmConvo[i - 1];
                      const next = dmConvo[i + 1];
                      const groupedWithPrev = prev && prev.from === msg.from;
                      const groupedWithNext = next && next.from === msg.from;
                      const showTime = !next || next.ts - msg.ts > 5 * 60 * 1000;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} ${groupedWithPrev ? "mt-0.5" : "mt-3"}`}>
                          <div className="max-w-[72%] sm:max-w-[60%]">
                            {!isMe && !groupedWithPrev && (
                              <p className="text-xs font-bold text-gray-400 mb-1 ml-1">{msg.from}</p>
                            )}
                            <div
                              className={`px-4 py-2.5 text-sm leading-relaxed break-words ${
                                isMe
                                  ? `bg-[#002A5C] text-white ${groupedWithNext ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-br-sm"} ${groupedWithPrev ? "rounded-tr-md" : ""}`
                                  : `bg-white border border-gray-100 text-gray-800 shadow-sm ${groupedWithNext ? "rounded-2xl rounded-bl-md" : "rounded-2xl rounded-bl-sm"} ${groupedWithPrev ? "rounded-tl-md" : ""}`
                              }`}
                            >
                              {msg.text}
                            </div>
                            {showTime && (
                              <p className={`text-[10px] text-gray-300 mt-1 ${isMe ? "text-right mr-1" : "ml-1"}`}>
                                {fmtDM(msg.ts)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={dmBottomRef} />
                  </div>
                )}
                {dmConvo.length === 0 && <div ref={dmBottomRef} />}
              </div>

              <div className="bg-white border-t border-gray-200 px-4 py-3 flex gap-3 items-end shrink-0">
                <textarea
                  ref={dmInputRef}
                  value={dmInput}
                  onChange={(e) => {
                    setDmInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleDMSend(); }
                  }}
                  placeholder={`Message ${dmActive}...`}
                  rows={1}
                  className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#002A5C]"
                  style={{ minHeight: "42px", maxHeight: "128px" }}
                />
                <button
                  onClick={handleDMSend}
                  disabled={!dmInput.trim()}
                  className="w-10 h-10 bg-[#002A5C] text-white rounded-full flex items-center justify-center hover:bg-black transition-colors disabled:opacity-40 shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </main>
          ) : (
            <main className={`${mobileView === "list" ? "hidden" : "flex"} md:flex flex-1 items-center justify-center bg-[#F4F6F9]`}>
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
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatInner />
    </Suspense>
  );
}
