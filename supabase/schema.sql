-- 440i18n schema
create extension if not exists "uuid-ossp";

create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade,
  transcript text not null,
  language varchar(10) default 'en',
  duration_seconds int,
  scores jsonb,
  pitch_data jsonb,
  filler_words jsonb,
  pronunciation_flags text[],
  biggest_issue text,
  whats_working text,
  created_at timestamptz default now()
);

alter table public.sessions enable row level security;

create policy "Users can only access their own sessions"
  on public.sessions for all
  using (auth.uid() = user_id);

create index sessions_user_id_idx on public.sessions(user_id);
create index sessions_created_at_idx on public.sessions(created_at desc);

-- Future pgvector:
-- create extension vector;
-- alter table sessions add column embedding vector(1536);
