-- Run this entire file in your Supabase dashboard → SQL Editor

-- PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text unique not null,
  year text,
  bio text,
  programs text[] default '{}',
  avatar text default '#002A5C',
  avatar_image text,
  cover_color text default '#002A5C',
  connections text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);
create policy "profiles_delete" on profiles for delete using (auth.uid() = id);

-- ROOMS (course matching)
create table if not exists public.rooms (
  code text primary key,
  created_at timestamptz default now()
);
alter table public.rooms enable row level security;
create policy "rooms_select" on rooms for select using (true);
create policy "rooms_insert" on rooms for insert with check (true);

create table if not exists public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_code text references rooms(code) on delete cascade not null,
  name text not null,
  courses text[] default '{}',
  joined_at timestamptz default now()
);
alter table public.room_members enable row level security;
create policy "room_members_select" on room_members for select using (true);
create policy "room_members_insert" on room_members for insert with check (true);

-- CHAT POSTS
create table if not exists public.chat_posts (
  id uuid primary key default gen_random_uuid(),
  course text not null,
  author text not null,
  text text not null,
  upvotes integer default 0,
  downvotes integer default 0,
  reported boolean default false,
  created_at timestamptz default now()
);
alter table public.chat_posts enable row level security;
create policy "chat_posts_select" on chat_posts for select using (true);
create policy "chat_posts_insert" on chat_posts for insert with check (auth.role() = 'authenticated');
create policy "chat_posts_update" on chat_posts for update using (auth.role() = 'authenticated');

create table if not exists public.chat_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references chat_posts(id) on delete cascade not null,
  author text not null,
  text text not null,
  created_at timestamptz default now()
);
alter table public.chat_replies enable row level security;
create policy "chat_replies_select" on chat_replies for select using (true);
create policy "chat_replies_insert" on chat_replies for insert with check (auth.role() = 'authenticated');

-- DIRECT MESSAGES
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  from_user text not null,
  to_user text not null,
  text text not null,
  created_at timestamptz default now()
);
alter table public.messages enable row level security;
create policy "messages_select" on messages for select using (
  from_user = (select display_name from profiles where id = auth.uid())
  or to_user = (select display_name from profiles where id = auth.uid())
);
create policy "messages_insert" on messages for insert with check (auth.role() = 'authenticated');

-- STUDY SESSIONS
create table if not exists public.study_sessions (
  id text primary key,
  code text unique not null,
  title text not null,
  subject text not null,
  host_name text not null,
  is_public boolean default true,
  participants text[] default '{}',
  materials text default '',
  quizzes jsonb default '[]',
  messages jsonb default '[]',
  created_at timestamptz default now()
);
alter table public.study_sessions enable row level security;
create policy "sessions_select" on study_sessions for select using (is_public = true or auth.role() = 'authenticated');
create policy "sessions_insert" on study_sessions for insert with check (auth.role() = 'authenticated');
create policy "sessions_update" on study_sessions for update using (auth.role() = 'authenticated');

-- QUIZ BANK
create table if not exists public.quizzes (
  id text primary key,
  code text unique not null,
  title text not null,
  course text,
  created_by text not null,
  questions jsonb not null default '[]',
  created_at timestamptz default now()
);
alter table public.quizzes enable row level security;
create policy "quizzes_select" on quizzes for select using (true);
create policy "quizzes_insert" on quizzes for insert with check (auth.role() = 'authenticated');
