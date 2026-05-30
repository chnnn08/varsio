"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProfile, getPublicProfile, saveProfile, type Profile } from "@/lib/profile";

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function Avatar({ name, color, size = "lg" }: { name: string; color: string; size?: "sm" | "lg" }) {
  const cls =
    size === "lg"
      ? "w-20 h-20 rounded-2xl text-2xl font-black"
      : "w-9 h-9 rounded-xl text-xs font-black";
  return (
    <div className={`${cls} text-white flex items-center justify-center shrink-0`} style={{ backgroundColor: color }}>
      {initials(name)}
    </div>
  );
}

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();

  const [me, setMe] = useState<Profile | null>(null);
  const [target, setTarget] = useState<Profile | null | "loading">("loading");
  const [connected, setConnected] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const decoded = decodeURIComponent(username ?? "");

  useEffect(() => {
    const myProfile = getProfile();
    setMe(myProfile);

    // If viewing own profile, redirect to /profile
    if (myProfile && myProfile.displayName.toLowerCase() === decoded.toLowerCase()) {
      router.replace("/profile");
      return;
    }

    const found = getPublicProfile(decoded);
    setTarget(found);

    if (myProfile && found) {
      setConnected(myProfile.connections.includes(found.displayName));
    }
  }, [decoded, router]);

  function toggleConnect() {
    if (!me || !target || target === "loading") return;
    const isConnected = me.connections.includes(target.displayName);
    const updated: Profile = {
      ...me,
      connections: isConnected
        ? me.connections.filter((c) => c !== target.displayName)
        : [...me.connections, target.displayName],
    };
    saveProfile(updated);
    setMe(updated);
    setConnected(!isConnected);
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  // -- loading ---------------------------------------------------------------
  if (target === "loading") {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#002A5C]/20 border-t-[#002A5C] rounded-full animate-spin" />
      </div>
    );
  }

  // -- not found -------------------------------------------------------------
  if (!target) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center px-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-300 flex items-center justify-center mx-auto mb-4 text-2xl font-black">?</div>
          <h2 className="text-xl font-black text-black mb-2">Profile not found</h2>
          <p className="text-gray-400 text-sm mb-6">
            <span className="font-mono font-semibold text-gray-500">{decoded}</span> hasn&apos;t created a profile yet, or the link is incorrect.
          </p>
          <button
            onClick={() => router.back()}
            className="bg-[#002A5C] text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-black transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // -- public profile view ---------------------------------------------------
  const programs = target.programs ?? [];
  const metaLine = [target.year, ...programs].filter(Boolean).join(" · ");

  return (
    <div>
      {/* Header */}
      <div className="bg-[#002A5C] text-white pt-14 pb-20 px-4 sm:px-6">
        <div className="max-w-lg mx-auto">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Profile</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">{target.displayName}</h1>
          {metaLine && <p className="text-white/50 mt-2 text-sm">{metaLine}</p>}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 -mt-8 pb-12 space-y-4">

        {/* Profile card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8">
          <div className="flex items-start gap-5">
            <Avatar name={target.displayName} color={target.avatar ?? "#002A5C"} />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-black text-black leading-tight">{target.displayName}</h2>
              {target.year && <p className="text-sm text-gray-400 mt-0.5">{target.year}</p>}
              {target.bio && (
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{target.bio}</p>
              )}
            </div>
          </div>

          {programs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-gray-100">
              {programs.map((prog) => (
                <span
                  key={prog}
                  className="bg-[#002A5C]/8 text-[#002A5C] text-xs font-semibold px-3 py-1.5 rounded-full"
                >
                  {prog}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {me ? (
            <button
              onClick={toggleConnect}
              className={`flex-1 font-bold py-3 rounded-xl text-sm transition-all ${
                connected
                  ? "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500"
                  : "bg-[#002A5C] text-white hover:bg-black"
              }`}
            >
              {connected ? "Remove Connection" : "+ Connect"}
            </button>
          ) : (
            <button
              onClick={() => router.push("/profile")}
              className="flex-1 bg-[#002A5C] text-white font-bold py-3 rounded-xl text-sm hover:bg-black transition-colors"
            >
              Create profile to connect
            </button>
          )}
          <button
            onClick={copyLink}
            className={`px-5 border font-semibold py-3 rounded-xl text-sm transition-all ${
              linkCopied
                ? "border-green-300 text-green-600 bg-green-50"
                : "border-gray-200 text-gray-500 hover:border-gray-400"
            }`}
          >
            {linkCopied ? "Copied!" : "Share"}
          </button>
        </div>

        {/* Connections count */}
        {(target.connections?.length ?? 0) > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Connections</p>
            <div className="flex flex-wrap gap-2">
              {target.connections.map((name) => (
                <button
                  key={name}
                  onClick={() => router.push(`/profile/${encodeURIComponent(name)}`)}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-xl transition-colors"
                >
                  <div
                    className="w-6 h-6 rounded-lg text-white text-xs font-black flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#002A5C" }}
                  >
                    {name[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-black">{name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
