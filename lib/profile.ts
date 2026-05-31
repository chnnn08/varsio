import { supabase } from "./supabase";

export type Profile = {
  id: string;
  displayName: string;
  year: string;
  programs: string[];
  bio: string;
  avatar: string;
  avatarImage?: string;
  coverColor: string;
  coverImage?: string;
  connections: string[];
};

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    displayName: row.display_name as string,
    year: (row.year as string) ?? "",
    programs: (row.programs as string[]) ?? [],
    bio: (row.bio as string) ?? "",
    avatar: (row.avatar as string) ?? "#002A5C",
    avatarImage: (row.avatar_image as string) ?? undefined,
    coverColor: (row.cover_color as string) ?? "#002A5C",
    coverImage: (row.cover_image as string) ?? undefined,
    connections: (row.connections as string[]) ?? [],
  };
}

export async function getProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error || !data) return null;
  return rowToProfile(data);
}

export async function saveProfile(p: Profile): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").upsert({
    id: user.id,
    display_name: p.displayName,
    year: p.year,
    programs: p.programs,
    bio: p.bio,
    avatar: p.avatar,
    avatar_image: p.avatarImage ?? null,
    cover_color: p.coverColor,
    cover_image: p.coverImage ?? null,
    connections: p.connections,
    updated_at: new Date().toISOString(),
  });
}

export async function clearProfile(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").delete().eq("id", user.id);
}

export async function getPublicProfile(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("display_name", username)
    .single();
  if (error || !data) return null;
  return rowToProfile(data);
}

export async function getAllPublicProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from("profiles").select("*");
  if (error || !data) return [];
  return data.map(rowToProfile);
}
