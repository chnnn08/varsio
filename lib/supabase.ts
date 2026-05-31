import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://oesqtcvwwprzfigroblq.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lc3F0Y3Z3d3ByemZpZ3JvYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMDg1MzcsImV4cCI6MjA5NTc4NDUzN30.OhkaG8Vyivnc-KKBRa2kiSA9ACUF6ona7Epx31cAdIE";

export const supabase = createClient(url, key);
