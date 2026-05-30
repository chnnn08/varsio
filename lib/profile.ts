export type Profile = {
  id: string;
  displayName: string;
  year: string;
  programs: string[];
  bio: string;
  avatar: string;       // hex color for avatar bg
  connections: string[]; // display names of added connections
};

const KEY = "arbor_profile";

export function getProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Profile;
    // backfill older profiles that lack new fields
    if (!p.avatar) p.avatar = "#002A5C";
    if (!p.connections) p.connections = [];
    return p;
  } catch {
    return null;
  }
}

export function saveProfile(p: Profile): void {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function clearProfile(): void {
  localStorage.removeItem(KEY);
}
