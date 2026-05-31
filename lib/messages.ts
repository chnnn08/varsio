import { supabase } from "./supabase";

export type Message = {
  id: string;
  from: string;
  to: string;
  text: string;
  ts: number;
};

function rowToMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    from: row.from_user as string,
    to: row.to_user as string,
    text: row.text as string,
    ts: new Date(row.created_at as string).getTime(),
  };
}

export async function getConvo(a: string, b: string): Promise<Message[]> {
  const aL = a.toLowerCase();
  const bL = b.toLowerCase();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(from_user.ilike.${aL},to_user.ilike.${bL}),and(from_user.ilike.${bL},to_user.ilike.${aL})`
    )
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(rowToMessage);
}

export async function sendDM(from: string, to: string, text: string): Promise<void> {
  await supabase.from("messages").insert({
    from_user: from,
    to_user: to,
    text: text.trim(),
  });
}

export async function getLastMessage(myName: string, other: string): Promise<Message | null> {
  const msgs = await getConvo(myName, other);
  return msgs[msgs.length - 1] ?? null;
}

export async function getConvoPartners(myName: string): Promise<string[]> {
  const myL = myName.toLowerCase();
  const { data, error } = await supabase
    .from("messages")
    .select("from_user, to_user, created_at")
    .or(`from_user.ilike.${myL},to_user.ilike.${myL}`)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  const seen = new Map<string, { name: string; ts: number }>();
  for (const row of data) {
    const other = (row.from_user as string).toLowerCase() === myL
      ? row.to_user as string
      : row.from_user as string;
    const key = other.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, { name: other, ts: new Date(row.created_at as string).getTime() });
    }
  }
  return [...seen.values()].sort((a, b) => b.ts - a.ts).map((v) => v.name);
}
