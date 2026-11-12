-- 009: bộ sưu tập đề, mục tiêu hằng ngày, đề hot tuần này, tìm kiếm người dùng / bộ sưu tập
-- Chạy trong Supabase → SQL Editor SAU 008. An toàn khi chạy lại.
-- Chạy file này TRƯỚC khi deploy code mới (code đang chạy vẫn hoạt động bình thường sau khi chạy).

-- ── 1. Mục tiêu số câu mỗi ngày ─────────────────────────────────────────
alter table public.profiles add column if not exists daily_goal integer not null default 20;
alter table public.profiles drop constraint if exists profiles_daily_goal_range;
alter table public.profiles add constraint profiles_daily_goal_range check (daily_goal between 5 and 500);

-- ── 2. Bộ sưu tập (gom nhiều đề thành một danh sách) ────────────────────
create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  title       text not null check (char_length(btrim(title)) between 1 and 120),
  description text check (description is null or char_length(description) <= 500),
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists collections_owner_idx  on public.collections(owner_id, updated_at desc);
create index if not exists collections_public_idx on public.collections(is_public, updated_at desc);

drop trigger if exists trg_collections_updated_at on public.collections;
create trigger trg_collections_updated_at before update on public.collections
  for each row execute procedure public.handle_updated_at();

create table if not exists public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  quiz_id       uuid not null references public.quizzes(id) on delete cascade,
  added_at      timestamptz not null default now(),
  primary key (collection_id, quiz_id)
);
create index if not exists collection_items_quiz_idx on public.collection_items(quiz_id);

alter table public.collections      enable row level security;
alter table public.collection_items enable row level security;

drop policy if exists "collections: read public or own" on public.collections;
drop policy if exists "collections: insert own"         on public.collections;
drop policy if exists "collections: update own"         on public.collections;
drop policy if exists "collections: delete own"         on public.collections;
create policy "collections: read public or own" on public.collections for select using (is_public or owner_id = auth.uid());
create policy "collections: insert own" on public.collections for insert with check (owner_id = auth.uid());
create policy "collections: update own" on public.collections for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "collections: delete own" on public.collections for delete using (owner_id = auth.uid());

drop policy if exists "collection items: read if collection visible" on public.collection_items;
drop policy if exists "collection items: add to own"                 on public.collection_items;
drop policy if exists "collection items: remove from own"            on public.collection_items;
create policy "collection items: read if collection visible" on public.collection_items for select using (
  exists (select 1 from public.collections c where c.id = collection_id and (c.is_public or c.owner_id = auth.uid()))
);
-- Chỉ thêm vào bộ sưu tập của mình, và chỉ đề mình xem được (công khai hoặc của mình).
create policy "collection items: add to own" on public.collection_items for insert with check (
  exists (select 1 from public.collections c where c.id = collection_id and c.owner_id = auth.uid())
  and exists (select 1 from public.quizzes q where q.id = quiz_id and (q.is_public or q.owner_id = auth.uid()))
);
create policy "collection items: remove from own" on public.collection_items for delete using (
  exists (select 1 from public.collections c where c.id = collection_id and c.owner_id = auth.uid())
);

-- Thêm / bớt đề thì bộ sưu tập được đẩy lên đầu danh sách "mới cập nhật".
create or replace function public.touch_collection()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.collections set updated_at = now()
   where id = coalesce(new.collection_id, old.collection_id);
  return coalesce(new, old);
end;
$$;
drop trigger if exists trg_collection_items_touch on public.collection_items;
create trigger trg_collection_items_touch after insert or delete on public.collection_items
  for each row execute procedure public.touch_collection();

-- ── 3. Đề hot: nhiều lượt làm nhất trong N ngày gần đây ─────────────────
-- security definer vì phải đếm kết quả của mọi người; chỉ trả về đề công khai và con số tổng.
create or replace function public.trending_quizzes(p_days integer default 7, p_limit integer default 6)
returns table (
  id uuid, title text, subject text, play_count integer, like_count integer, question_count bigint,
  recent_plays bigint, owner_name text, owner_avatar text, owner_username text
)
language sql stable security definer set search_path = public
as $$
  select q.id, q.title, q.subject, q.play_count, q.like_count,
         (select count(*) from public.questions x where x.quiz_id = q.id),
         count(r.id),
         coalesce(nullif(p.display_name, ''), p.username), p.avatar_url, p.username
    from public.quizzes q
    join public.results r  on r.quiz_id = q.id
                          and r.completed_at >= now() - make_interval(days => least(greatest(coalesce(p_days, 7), 1), 90))
    join public.profiles p on p.id = q.owner_id
   where q.is_public = true
     and exists (select 1 from public.questions x where x.quiz_id = q.id)
   group by q.id, p.id
   order by count(r.id) desc, q.like_count desc, q.created_at desc
   limit least(greatest(coalesce(p_limit, 6), 1), 24);
$$;
revoke all on function public.trending_quizzes(integer, integer) from public;
grant execute on function public.trending_quizzes(integer, integer) to anon, authenticated;

-- ── 4. Tìm người dùng (không dấu: "thu ha" khớp "Thu Hà") ───────────────
create or replace function public.search_profiles(p_query text, p_limit integer default 10)
returns table (
  id uuid, username text, display_name text, avatar_url text, bio text, follower_count integer
)
language sql stable security invoker set search_path = public
as $$
  with params as (
    select '%' || replace(replace(replace(extensions.unaccent(lower(btrim(coalesce(p_query, '')))), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern
  )
  select p.id, p.username, coalesce(nullif(p.display_name, ''), p.username), p.avatar_url, p.bio, p.follower_count
    from public.profiles p, params
   where btrim(coalesce(p_query, '')) <> ''
     and extensions.unaccent(lower(p.username || ' ' || coalesce(p.display_name, ''))) like params.pattern
   order by p.follower_count desc, p.username
   limit least(greatest(coalesce(p_limit, 10), 1), 50);
$$;
grant execute on function public.search_profiles(text, integer) to anon, authenticated;

-- ── 5. Tìm bộ sưu tập công khai ─────────────────────────────────────────
create or replace function public.search_collections(p_query text, p_limit integer default 10)
returns table (
  id uuid, title text, description text, item_count bigint, updated_at timestamptz,
  owner_name text, owner_avatar text, owner_username text
)
language sql stable security invoker set search_path = public
as $$
  with params as (
    select '%' || replace(replace(replace(extensions.unaccent(lower(btrim(coalesce(p_query, '')))), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern
  )
  select c.id, c.title, c.description,
         (select count(*) from public.collection_items i where i.collection_id = c.id),
         c.updated_at, coalesce(nullif(p.display_name, ''), p.username), p.avatar_url, p.username
    from public.collections c
    join public.profiles p on p.id = c.owner_id, params
   where c.is_public = true
     and btrim(coalesce(p_query, '')) <> ''
     and extensions.unaccent(lower(c.title || ' ' || coalesce(c.description, ''))) like params.pattern
   order by c.updated_at desc
   limit least(greatest(coalesce(p_limit, 10), 1), 50);
$$;
grant execute on function public.search_collections(text, integer) to anon, authenticated;
