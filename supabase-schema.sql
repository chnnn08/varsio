-- Run this entire file in your Supabase dashboard → SQL Editor
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE

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
  cover_image text,
  connections text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);
create policy "profiles_delete" on profiles for delete using (auth.uid() = id);

-- Auto-update updated_at on profile changes
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function update_updated_at();

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
  courses jsonb default '[]',
  joined_at timestamptz default now()
);
alter table public.room_members enable row level security;
create policy "room_members_select" on room_members for select using (true);
create policy "room_members_insert" on room_members for insert with check (true);

-- Prevent duplicate entries in same room
alter table public.room_members
  drop constraint if exists room_members_unique,
  add constraint room_members_unique unique (room_code, name);

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
  read_at timestamptz,
  created_at timestamptz default now()
);
alter table public.messages enable row level security;
create policy "messages_select" on messages for select using (
  from_user = (select display_name from profiles where id = auth.uid())
  or to_user = (select display_name from profiles where id = auth.uid())
);
create policy "messages_insert" on messages for insert with check (auth.role() = 'authenticated');
create policy "messages_update" on messages for update using (
  to_user = (select display_name from profiles where id = auth.uid())
);

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

-- CONNECTION REQUESTS (for profile connect flow)
create table if not exists public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  from_user text not null,
  to_user text not null,
  status text not null default 'pending',
  created_at timestamptz default now(),
  constraint conn_req_unique unique (from_user, to_user),
  constraint status_check check (status in ('pending', 'accepted', 'declined'))
);
alter table public.connection_requests enable row level security;
create policy "conn_req_select" on connection_requests for select using (
  from_user = (select display_name from profiles where id = auth.uid())
  or to_user = (select display_name from profiles where id = auth.uid())
);
create policy "conn_req_insert" on connection_requests for insert with check (auth.role() = 'authenticated');
create policy "conn_req_update" on connection_requests for update using (auth.role() = 'authenticated');

-- NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_name text not null,
  type text not null,
  from_user text,
  message text,
  read boolean default false,
  created_at timestamptz default now(),
  constraint notif_type_check check (type in ('dm', 'mention', 'connection_request', 'connection_accepted'))
);
alter table public.notifications enable row level security;
create policy "notif_select" on notifications for select using (
  user_name = (select display_name from profiles where id = auth.uid())
);
create policy "notif_insert" on notifications for insert with check (auth.role() = 'authenticated');
create policy "notif_update" on notifications for update using (
  user_name = (select display_name from profiles where id = auth.uid())
);

-- INDEXES (performance on common queries)
create index if not exists idx_messages_to on messages(to_user);
create index if not exists idx_messages_from on messages(from_user);
create index if not exists idx_messages_created on messages(created_at desc);
create index if not exists idx_chat_posts_course on chat_posts(course);
create index if not exists idx_chat_posts_created on chat_posts(created_at desc);
create index if not exists idx_chat_replies_post on chat_replies(post_id);
create index if not exists idx_room_members_room on room_members(room_code);
create index if not exists idx_study_sessions_code on study_sessions(code);
create index if not exists idx_quizzes_code on quizzes(code);
create index if not exists idx_notifications_user on notifications(user_name);
create index if not exists idx_conn_req_to on connection_requests(to_user);

-- REALTIME (enables push events for DMs and notifications)
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;
