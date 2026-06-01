"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProfile, getPublicProfile, saveProfile, type Profile } from "@/lib/profile";

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function ProfilePhoto({
  name, avatar, avatarImage, size = 80, border = false,
}: {
  name: string; avatar: string; avatarImage?: string; size?: number; border?: boolean;
}) {
  const shared: CSSProperties = {
    width: size, height: size, borderRadius: "50%",
    border: border ? "4px solid white" : "none",
    flexShrink: 0,
  };
  if (avatarImage) {
    return <img src={avatarImage} alt={name} style={{ ...shared, objectFit: "cover" }} />;
  }
  const fontSize = size >= 64 ? 22 : size >= 36 ? 13 : 10;
  return (
    <div
      style={{ ...shared, backgroundColor: avatar, fontSize }}
      className="text-white font-black flex items-center justify-center"
    >
      {initials(name || "?")}
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
    async function init() {
      const myProfile = await getProfile();
      setMe(myProfile);

      if (myProfile && myProfile.displayName.toLowerCase() === decoded.toLowerCase()) {
        router.replace("/profile");
        return;
      }

      const found = await getPublicProfile(decoded);
      setTarget(found);

      if (myProfile && found) {
        setConnected(myProfile.connections.includes(found.displayName));
      }
    }
    init();
  }, [decoded, router]);

  async function toggleConnect() {
    if (!me || !target || target === "loading") return;
    const isConnected = me.connections.includes(target.displayName);
    const updated: Profile = {
      ...me,
      connections: isConnected
        ? me.connections.filter((c) => c !== target.displayName)
        : [...me.connections, target.displayName],
    };
    await saveProfile(updated);
    setMe(updated);
    setConnected(!isConnected);
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  if (target === "loading") {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#002A5C]/20 border-t-[#002A5C] rounded-full animate-spin" />
      </div>
    );
  }

  if (!target) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center px-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-300 flex items-center justify-center mx-auto mb-4 text-2xl font-black">?</div>
          <h2 className="text-xl font-black text-black mb-2">Profile not found</h2>
          <p className="text-gray-400 text-sm mb-6">
            <span className="font-mono font-semibold text-gray-500">{decoded}</span> hasn&apos;t created a profile yet.
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

  const programs = target.programs ?? [];

  return (
    <div>
      {/* Cover banner */}
      <div
        className="h-48"
        style={{
          backgroundColor: target.coverColor ?? "#002A5C",
          backgroundImage: target.coverImage ? `url(${target.coverImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="max-w-lg mx-auto px-6 pb-16">
        {/* Avatar overlapping cover */}
        <div className="-mt-10 mb-3">
          <ProfilePhoto
            name={target.displayName}
            avatar={target.avatar ?? "#002A5C"}
            avatarImage={target.avatarImage}
            size={84}
            border
          />
        </div>

        {/* Name + tag + year */}
        <h1 className="text-2xl font-black text-black leading-tight">{target.displayName}</h1>
        {target.tag && <p className="text-sm text-gray-400 font-medium mt-0.5">@{target.tag}</p>}
        {target.year && <p className="text-sm text-gray-500 mt-0.5">{target.year}</p>}

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          {me ? (
            <>
              <button
                onClick={toggleConnect}
                className={`flex-1 font-bold py-3 rounded-xl text-sm transition-all ${
                  connected
                    ? "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500"
                    : "bg-[#002A5C] text-white hover:bg-black"
                }`}
              >
                {connected ? "Connected" : "+ Connect"}
              </button>
              <button
                onClick={() => router.push(`/chat?tab=dm&with=${encodeURIComponent(target.displayName)}`)}
                className="px-5 bg-[#F0B429] text-[#002A5C] font-bold py-3 rounded-xl text-sm hover:bg-yellow-400 transition-colors"
              >
                Message
              </button>
            </>
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

        <div className="mt-5 space-y-4">

          {/* About card */}
          {(target.bio || programs.length > 0) && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">About</p>
              {target.bio && (
                <p className="text-sm text-gray-600 leading-relaxed">{target.bio}</p>
              )}
              {target.bio && programs.length > 0 && (
                <div className="border-t border-gray-100 my-4" />
              )}
              {programs.length > 0 && (
                <div className="flex flex-wrap gap-2">
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
          )}

          {/* Connections */}
          {(target.connections?.length ?? 0) > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Connections ({target.connections.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {target.connections.map((name) => (
                  <button
                    key={name}
                    onClick={() => router.push(`/profile/${encodeURIComponent(name)}`)}
                    className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-xl transition-colors"
                  >
                    <div
                      className="w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center shrink-0"
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
    </div>
  );
}
