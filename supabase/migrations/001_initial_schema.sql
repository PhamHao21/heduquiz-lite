create extension if not exists "uuid-ossp";
-- ── Tables ──────────────────────────────────────────────────

-- profiles (mirrors auth.users)
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  display_name text,
  avatar_url   text,
  bio          text,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

-- quizzes
create table public.quizzes (
  id           uuid primary key default uuid_generate_v4(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  description  text,
  subject      text,
  raw_text     text,                        -- original parser input
  is_public    boolean default true not null,
  play_count   integer default 0 not null,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

-- questions  (JSONB options for flexibility)
create table public.questions (
  id           uuid primary key default uuid_generate_v4(),
  quiz_id      uuid not null references public.quizzes(id) on delete cascade,
  position     smallint not null,
  content      text not null,
  options      jsonb not null,   -- [{ label, text, is_correct }]
  multi        boolean default false not null,  -- true = multiple correct answers
  explanation  text,
  created_at   timestamptz default now() not null
);

-- results
create table public.results (
  id            uuid primary key default uuid_generate_v4(),
  quiz_id       uuid not null references public.quizzes(id) on delete cascade,
  user_id       uuid references public.profiles(id) on delete set null,
  score         smallint not null,
  total         smallint not null,
  time_spent    integer,          -- seconds
  answers       jsonb not null,   -- [{ question_id, chosen, correct }]
  completed_at  timestamptz default now() not null
);

-- ── Indexes ──────────────────────────────────────────────────
create index on public.quizzes(owner_id);
create index on public.quizzes(subject);
create index on public.quizzes(is_public, created_at desc);
create index on public.questions(quiz_id, position);
create index on public.results(quiz_id);
create index on public.results(user_id);

-- ── Updated_at trigger ───────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger trg_quizzes_updated_at
  before update on public.quizzes
  for each row execute procedure public.handle_updated_at();

-- ── Auto-create profile on signup ────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'user_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── RLS ──────────────────────────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.quizzes   enable row level security;
alter table public.questions enable row level security;
alter table public.results   enable row level security;

-- profiles
create policy "profiles: public read"
  on public.profiles for select using (true);

create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id);

-- quizzes
create policy "quizzes: public read if public"
  on public.quizzes for select
  using (is_public = true or auth.uid() = owner_id);

create policy "quizzes: owner insert"
  on public.quizzes for insert
  with check (auth.uid() = owner_id);

create policy "quizzes: owner update"
  on public.quizzes for update
  using (auth.uid() = owner_id);

create policy "quizzes: owner delete"
  on public.quizzes for delete
  using (auth.uid() = owner_id);

-- questions (inherit quiz visibility)
create policy "questions: read if quiz accessible"
  on public.questions for select
  using (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_id
        and (q.is_public = true or q.owner_id = auth.uid())
    )
  );

create policy "questions: owner insert"
  on public.questions for insert
  with check (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_id and q.owner_id = auth.uid()
    )
  );

create policy "questions: owner update/delete"
  on public.questions for update
  using (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_id and q.owner_id = auth.uid()
    )
  );

create policy "questions: owner delete"
  on public.questions for delete
  using (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_id and q.owner_id = auth.uid()
    )
  );

-- results
create policy "results: owner read"
  on public.results for select
  using (auth.uid() = user_id);

create policy "results: quiz owner read"
  on public.results for select
  using (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_id and q.owner_id = auth.uid()
    )
  );

create policy "results: authenticated insert"
  on public.results for insert
  with check (auth.uid() = user_id or user_id is null);

alter table public.quizzes
  alter column is_public set default false;

create index if not exists idx_quizzes_owner_created
  on public.quizzes(owner_id, created_at desc);

alter table public.quizzes
  add column if not exists sections jsonb default null;

create index if not exists idx_quizzes_has_sections
  on public.quizzes ((sections is not null))
  where sections is not null;

-- Thêm comment để documentation
comment on column public.quizzes.sections is
  'Mảng JSON các phần thi: [{ id, name, from, to }] — from/to là position câu hỏi (1-based)';