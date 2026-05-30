export type Profile = {
  id: string;
  displayName: string;
  year: string;
  programs: string[];
  bio: string;
  avatar: string;
  connections: string[];
};

const KEY = "arbor_profile";
const PUBLIC_KEY = "varsio_public_profiles";

export function getProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Profile;
    if (!p.avatar) p.avatar = "#002A5C";
    if (!p.connections) p.connections = [];
    return p;
  } catch {
    return null;
  }
}

export function saveProfile(p: Profile): void {
  localStorage.setItem(KEY, JSON.stringify(p));
  // also publish to the shared store so others can find this profile by username
  registerPublicProfile(p);
}

export function clearProfile(): void {
  localStorage.removeItem(KEY);
}

export function registerPublicProfile(p: Profile): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(PUBLIC_KEY) ?? "{}";
    const store = JSON.parse(raw) as Record<string, Profile>;
    store[p.displayName.toLowerCase()] = p;
    localStorage.setItem(PUBLIC_KEY, JSON.stringify(store));
  } catch {}
}

export function getPublicProfile(username: string): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PUBLIC_KEY) ?? "{}";
    const store = JSON.parse(raw) as Record<string, Profile>;
    return store[username.toLowerCase()] ?? null;
  } catch {
    return null;
  }
}

export function getAllPublicProfiles(): Profile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PUBLIC_KEY) ?? "{}";
    return Object.values(JSON.parse(raw) as Record<string, Profile>);
  } catch {
    return [];
  }
}
