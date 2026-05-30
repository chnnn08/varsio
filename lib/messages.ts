export type Message = {
  id: string;
  from: string;
  to: string;
  text: string;
  ts: number;
};

const KEY = "varsio_dms";

function load(): Message[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); }
  catch { return []; }
}

function save(msgs: Message[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(msgs));
}

export function getConvo(a: string, b: string): Message[] {
  const aL = a.toLowerCase();
  const bL = b.toLowerCase();
  return load()
    .filter(
      (m) =>
        (m.from.toLowerCase() === aL && m.to.toLowerCase() === bL) ||
        (m.from.toLowerCase() === bL && m.to.toLowerCase() === aL)
    )
    .sort((x, y) => x.ts - y.ts);
}

export function sendDM(from: string, to: string, text: string): void {
  const msgs = load();
  msgs.push({ id: crypto.randomUUID(), from, to, text: text.trim(), ts: Date.now() });
  save(msgs);
}

export function getLastMessage(myName: string, other: string): Message | null {
  const msgs = getConvo(myName, other);
  return msgs[msgs.length - 1] ?? null;
}

export function getConvoPartners(myName: string): string[] {
  const myL = myName.toLowerCase();
  const seen = new Map<string, { name: string; ts: number }>();
  for (const m of load()) {
    if (m.from.toLowerCase() === myL) {
      const key = m.to.toLowerCase();
      const cur = seen.get(key);
      if (!cur || m.ts > cur.ts) seen.set(key, { name: m.to, ts: m.ts });
    }
    if (m.to.toLowerCase() === myL) {
      const key = m.from.toLowerCase();
      const cur = seen.get(key);
      if (!cur || m.ts > cur.ts) seen.set(key, { name: m.from, ts: m.ts });
    }
  }
  return [...seen.values()].sort((a, b) => b.ts - a.ts).map(({ name }) => name);
}
