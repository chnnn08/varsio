"use client";

import { useState, useRef, useEffect } from "react";

type AgentType = "marketing" | "admin" | "connections";
type Role = "user" | "assistant";
interface Message { role: Role; content: string; }

const AGENTS: {
  id: AgentType;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  color: string;
  accent: string;
  starters: string[];
}[] = [
  {
    id: "marketing",
    name: "Marketing Agent",
    tagline: "Grow Varsio on campus & social",
    description: "Generate Instagram captions, LinkedIn posts, flyer copy, TikTok scripts, campaign ideas, and hashtag strategies tailored for UofT students.",
    icon: "📣",
    color: "bg-orange-50 border-orange-200",
    accent: "bg-orange-500",
    starters: [
      "Write an Instagram post promoting our textbook marketplace",
      "Create a TikTok hook for our study space check-in feature",
      "Plan a campaign to onboard 500 students before September",
      "Write a campus flyer for our course-matching feature",
    ],
  },
  {
    id: "admin",
    name: "Admin Agent",
    tagline: "Operate & grow the platform",
    description: "Draft community guidelines, handle moderation decisions, plan growth strategy, write announcements, and manage ambassador programs.",
    icon: "⚙️",
    color: "bg-blue-50 border-blue-200",
    accent: "bg-[#002A5C]",
    starters: [
      "Write community guidelines for our course chat feature",
      "Draft an announcement for our new profile @tag feature",
      "Create an ambassador program structure for UTM campus",
      "What metrics should we track to measure platform health?",
    ],
  },
  {
    id: "connections",
    name: "Connections Agent",
    tagline: "Build your UofT network",
    description: "Get personalized networking messages, study group pitches, mentorship outreach, LinkedIn templates, and research cold emails for UofT students.",
    icon: "🤝",
    color: "bg-green-50 border-green-200",
    accent: "bg-green-600",
    starters: [
      "Write a LinkedIn message to a UofT CS alumni at Google",
      "Help me recruit people for my ECE study group",
      "Draft a cold email to a professor for a research position",
      "Write a mentorship request to a 4th-year EngSci student",
    ],
  },
];

function formatText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("### ")) {
      return <p key={i} className="font-bold text-sm mt-3 mb-1">{line.slice(4)}</p>;
    }
    if (line.startsWith("## ")) {
      return <p key={i} className="font-bold text-base mt-3 mb-1">{line.slice(3)}</p>;
    }
    if (line.startsWith("**") && line.endsWith("**")) {
      return <p key={i} className="font-semibold text-sm">{line.slice(2, -2)}</p>;
    }
    if (line.startsWith("- ") || line.startsWith("• ")) {
      return <p key={i} className="text-sm ml-3">• {line.slice(2)}</p>;
    }
    if (line.trim() === "") return <br key={i} />;
    return (
      <p key={i} className="text-sm leading-relaxed">
        {line.split(/(\*\*.*?\*\*)/g).map((part, j) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={j}>{part.slice(2, -2)}</strong>
            : part
        )}
      </p>
    );
  });
}

export default function AgentsPage() {
  const [activeAgent, setActiveAgent] = useState<AgentType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const agent = AGENTS.find((a) => a.id === activeAgent) ?? null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  function selectAgent(id: AgentType) {
    setActiveAgent(id);
    setMessages([]);
    setInput("");
    setStreamText("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || !activeAgent || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    setStreamText("");

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentType: activeAgent,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreamText(full);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: full }]);
      setStreamText("");
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
      setStreamText("");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      {/* Header */}
      <div className="bg-[#002A5C] text-white px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🤖</span>
            <h1 className="text-2xl font-black tracking-tight">AI Agents</h1>
          </div>
          <p className="text-white/60 text-sm max-w-lg">
            Specialized AI assistants built for Varsio — marketing, administration, and student networking.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Agent selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {AGENTS.map((a) => (
            <button
              key={a.id}
              onClick={() => selectAgent(a.id)}
              className={`text-left p-4 rounded-2xl border-2 transition-all ${
                activeAgent === a.id
                  ? "border-[#002A5C] bg-white shadow-md"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{a.icon}</span>
                {activeAgent === a.id && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-[#F0B429]" />
                )}
              </div>
              <p className="font-black text-sm text-black">{a.name}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">{a.tagline}</p>
            </button>
          ))}
        </div>

        {/* Chat area */}
        {agent ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col" style={{ height: "calc(100vh - 340px)", minHeight: 400 }}>
            {/* Agent header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <span className="text-2xl">{agent.icon}</span>
              <div>
                <p className="font-black text-sm text-black">{agent.name}</p>
                <p className="text-xs text-gray-400">{agent.description}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.length === 0 && !streamText && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="text-4xl mb-4">{agent.icon}</div>
                  <p className="font-bold text-gray-700 mb-1">{agent.name}</p>
                  <p className="text-sm text-gray-400 mb-6 max-w-sm">{agent.description}</p>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Try asking</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                    {agent.starters.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-left px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-xs text-gray-600 font-medium transition-colors border border-gray-100"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-[#002A5C] text-white text-xs flex items-center justify-center shrink-0 mr-2 mt-1 font-bold">
                      {agent.icon}
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      m.role === "user"
                        ? "bg-[#002A5C] text-white text-sm"
                        : "bg-gray-50 text-gray-800 space-y-1"
                    }`}
                  >
                    {m.role === "user" ? (
                      <p className="text-sm leading-relaxed">{m.content}</p>
                    ) : (
                      formatText(m.content)
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming response */}
              {streamText && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-[#002A5C] text-white text-xs flex items-center justify-center shrink-0 mr-2 mt-1 font-bold">
                    {agent.icon}
                  </div>
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-50 text-gray-800 space-y-1">
                    {formatText(streamText)}
                    <span className="inline-block w-1.5 h-4 bg-gray-400 animate-pulse ml-0.5 rounded-sm" />
                  </div>
                </div>
              )}

              {loading && !streamText && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-[#002A5C] text-white text-xs flex items-center justify-center shrink-0 mr-2 mt-1">
                    {agent.icon}
                  </div>
                  <div className="bg-gray-50 rounded-2xl px-4 py-3 flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex items-end gap-2 bg-gray-50 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-[#002A5C]/20">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={`Ask the ${agent.name}...`}
                  rows={1}
                  disabled={loading}
                  className="flex-1 bg-transparent resize-none text-sm focus:outline-none text-gray-800 placeholder-gray-400 py-1 max-h-32 disabled:opacity-50"
                  style={{ lineHeight: "1.5" }}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  className="shrink-0 w-8 h-8 rounded-lg bg-[#002A5C] text-white flex items-center justify-center disabled:opacity-30 hover:bg-black transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
              <p className="text-center text-xs text-gray-300 mt-2">Press Enter to send · Shift+Enter for new line</p>
            </div>
          </div>
        ) : (
          /* No agent selected */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">🤖</div>
            <h2 className="text-xl font-black text-black mb-2">Choose an Agent</h2>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              Select one of the three AI agents above to get started. Each agent is specialized for a different aspect of Varsio.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
