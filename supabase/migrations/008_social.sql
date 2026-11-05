-- 008: mạng xã hội — theo dõi tác giả, thả tim đề, bình luận, thông báo, bảng tin
-- Chạy trong Supabase → SQL Editor SAU 007. An toàn khi chạy lại.
-- Chạy file này TRƯỚC khi deploy code mới (code cũ vẫn chạy bình thường sau khi chạy file này).

-- ── 0. Bộ đếm (cập nhật tự động bằng trigger, đọc nhanh không cần đếm lại) ──
alter table public.quizzes  add column if not exists like_count      integer not null default 0;
alter table public.profiles add column if not exists follower_count  integer not null default 0;
alter table public.profiles add column if not exists following_count integer not null default 0;

-- updated_at của đề chỉ đổi khi nội dung đề đổi (không đổi khi tăng lượt ôn / lượt tim),
-- để "Kho đề" sắp theo ngày cập nhật không bị xáo trộn.
drop trigger if exists trg_quizzes_updated_at on public.quizzes;
create trigger trg_quizzes_updated_at
  before update on public.quizzes
  for each row
  when ((old.title, old.description, old.subject, old.raw_text, old.is_public, old.sections)
        is distinct from
        (new.title, new.description, new.subject, new.raw_text, new.is_public, new.sections))
  execute procedure public.handle_updated_at();

-- ── 1. Theo dõi ─────────────────────────────────────────────────────────
create table if not exists public.follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);
create index if not exists follows_following_idx on public.follows(following_id, created_at desc);

alter table public.follows enable row level security;
drop policy if exists "follows: public read" on public.follows;
drop policy if exists "follows: insert own"  on public.follows;
drop policy if exists "follows: delete own"  on public.follows;
create policy "follows: public read" on public.follows for select using (true);
create policy "follows: insert own"  on public.follows for insert with check (auth.uid() = follower_id);
create policy "follows: delete own"  on public.follows for delete using (auth.uid() = follower_id);

-- ── 2. Thả tim đề ───────────────────────────────────────────────────────
create table if not exists public.quiz_likes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  quiz_id    uuid not null references public.quizzes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, quiz_id)
);
create index if not exists quiz_likes_quiz_idx on public.quiz_likes(quiz_id);
create index if not exists quiz_likes_user_idx on public.quiz_likes(user_id, created_at desc);

alter table public.quiz_likes enable row level security;
drop policy if exists "likes: read own"   on public.quiz_likes;
drop policy if exists "likes: insert own" on public.quiz_likes;
drop policy if exists "likes: delete own" on public.quiz_likes;
-- Ai thả tim đề nào là thông tin riêng; mọi người chỉ thấy tổng số tim (quizzes.like_count).
create policy "likes: read own" on public.quiz_likes for select using (auth.uid() = user_id);
create policy "likes: insert own" on public.quiz_likes for insert with check (
  auth.uid() = user_id
  and exists (select 1 from public.quizzes q where q.id = quiz_id and (q.is_public or q.owner_id = auth.uid()))
);
create policy "likes: delete own" on public.quiz_likes for delete using (auth.uid() = user_id);

-- ── 3. Bình luận ────────────────────────────────────────────────────────
create table if not exists public.quiz_comments (
  id         uuid primary key default gen_random_uuid(),
  quiz_id    uuid not null references public.quizzes(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  content    text not null check (char_length(btrim(content)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists quiz_comments_quiz_idx on public.quiz_comments(quiz_id, created_at desc);

alter table public.quiz_comments enable row level security;
drop policy if exists "comments: read if quiz accessible" on public.quiz_comments;
drop policy if exists "comments: insert own"              on public.quiz_comments;
drop policy if exists "comments: delete own or owner"     on public.quiz_comments;
create policy "comments: read if quiz accessible" on public.quiz_comments for select using (
  exists (select 1 from public.quizzes q where q.id = quiz_id and (q.is_public or q.owner_id = auth.uid()))
);
create policy "comments: insert own" on public.quiz_comments for insert with check (
  auth.uid() = user_id
  and exists (select 1 from public.quizzes q where q.id = quiz_id and (q.is_public or q.owner_id = auth.uid()))
);
-- Người viết xoá được bình luận của mình; chủ đề xoá được mọi bình luận trong đề của mình.
create policy "comments: delete own or owner" on public.quiz_comments for delete using (
  auth.uid() = user_id
  or exists (select 1 from public.quizzes q where q.id = quiz_id and q.owner_id = auth.uid())
);

-- ── 4. Thông báo ────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,   -- người nhận
  actor_id   uuid not null references public.profiles(id) on delete cascade,   -- người làm
  type       text not null check (type in ('follow', 'like', 'comment')),
  quiz_id    uuid references public.quizzes(id) on delete cascade,
  comment_id uuid references public.quiz_comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at    timestamptz
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;
drop policy if exists "notifications: read own"   on public.notifications;
drop policy if exists "notifications: update own" on public.notifications;
drop policy if exists "notifications: delete own" on public.notifications;
create policy "notifications: read own"   on public.notifications for select using (auth.uid() = user_id);
create policy "notifications: update own" on public.notifications for update using (auth.uid() = user_id);
create policy "notifications: delete own" on public.notifications for delete using (auth.uid() = user_id);
-- Không có quyền insert: thông báo chỉ được tạo bởi trigger bên dưới.

-- ── 5. Trigger: bộ đếm + thông báo ──────────────────────────────────────
create or replace function public.on_follow_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set follower_count  = follower_count + 1  where id = new.following_id;
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    -- theo dõi / bỏ theo dõi liên tục không tạo nhiều thông báo trùng
    delete from public.notifications
     where user_id = new.following_id and actor_id = new.follower_id and type = 'follow';
    insert into public.notifications (user_id, actor_id, type) values (new.following_id, new.follower_id, 'follow');
    return new;
  else
    update public.profiles set follower_count  = greatest(follower_count - 1, 0)  where id = old.following_id;
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    return old;
  end if;
end;
$$;
drop trigger if exists trg_follow_change on public.follows;
create trigger trg_follow_change after insert or delete on public.follows
  for each row execute procedure public.on_follow_change();

create or replace function public.on_like_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  if tg_op = 'INSERT' then
    update public.quizzes set like_count = like_count + 1 where id = new.quiz_id returning owner_id into v_owner;
    if v_owner is not null and v_owner <> new.user_id then
      delete from public.notifications
       where user_id = v_owner and actor_id = new.user_id and type = 'like' and quiz_id = new.quiz_id;
      insert into public.notifications (user_id, actor_id, type, quiz_id) values (v_owner, new.user_id, 'like', new.quiz_id);
    end if;
    return new;
  else
    update public.quizzes set like_count = greatest(like_count - 1, 0) where id = old.quiz_id;
    return old;
  end if;
end;
$$;
drop trigger if exists trg_like_change on public.quiz_likes;
create trigger trg_like_change after insert or delete on public.quiz_likes
  for each row execute procedure public.on_like_change();

create or replace function public.on_comment_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  select owner_id into v_owner from public.quizzes where id = new.quiz_id;
  if v_owner is not null and v_owner <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, quiz_id, comment_id)
    values (v_owner, new.user_id, 'comment', new.quiz_id, new.id);
  end if;
  return new;
end;
$$;
drop trigger if exists trg_comment_insert on public.quiz_comments;
create trigger trg_comment_insert after insert on public.quiz_comments
  for each row execute procedure public.on_comment_insert();

-- ── 6. Bảng tin: đề công khai mới của những người mình theo dõi ─────────
create or replace function public.following_feed(p_limit integer default 20, p_offset integer default 0)
returns table (
  id uuid, title text, subject text, play_count integer, like_count integer, question_count bigint,
  created_at timestamptz, owner_id uuid, owner_name text, owner_avatar text, owner_username text
)
language sql stable security invoker set search_path = public
as $$
  select q.id, q.title, q.subject, q.play_count, q.like_count,
         (select count(*) from public.questions x where x.quiz_id = q.id),
         q.created_at, q.owner_id, coalesce(nullif(p.display_name, ''), p.username), p.avatar_url, p.username
    from public.follows f
    join public.quizzes q  on q.owner_id = f.following_id and q.is_public = true
    join public.profiles p on p.id = q.owner_id
   where f.follower_id = auth.uid()
     and exists (select 1 from public.questions x where x.quiz_id = q.id)
   order by q.created_at desc
   limit least(greatest(coalesce(p_limit, 20), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;
revoke all on function public.following_feed(integer, integer) from public, anon;
grant execute on function public.following_feed(integer, integer) to authenticated;

-- ── 7. Gợi ý tác giả nên theo dõi ───────────────────────────────────────
create or replace function public.suggested_authors(p_limit integer default 6)
returns table (
  id uuid, username text, display_name text, avatar_url text, bio text,
  follower_count integer, public_quizzes bigint, total_likes bigint
)
language sql stable security invoker set search_path = public
as $$
  select p.id, p.username, coalesce(nullif(p.display_name, ''), p.username), p.avatar_url, p.bio,
         p.follower_count, count(q.id), coalesce(sum(q.like_count), 0)
    from public.profiles p
    join public.quizzes q on q.owner_id = p.id and q.is_public = true
   where p.id is distinct from auth.uid()
     and not exists (select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = p.id)
   group by p.id
   order by p.follower_count desc, coalesce(sum(q.like_count), 0) desc, count(q.id) desc
   limit least(greatest(coalesce(p_limit, 6), 1), 24);
$$;
grant execute on function public.suggested_authors(integer) to anon, authenticated;

-- ── 8. Khám phá: thêm số tim + sắp xếp "nhiều tim nhất" ─────────────────
drop function if exists public.explore_quizzes(text, text, text, integer, integer);
create or replace function public.explore_quizzes(
  p_search  text    default null,
  p_subject text    default null,
  p_sort    text    default 'popular',   -- 'popular' | 'new' | 'liked'
  p_limit   integer default 24,
  p_offset  integer default 0
)
returns table (
  id uuid, title text, subject text, description text, play_count integer, like_count integer,
  question_count bigint, created_at timestamptz, owner_id uuid, owner_name text, owner_avatar text,
  owner_username text, total_count bigint
)
language sql stable security invoker set search_path = public
as $$
  with params as (
    select nullif(btrim(p_search), '') as search, nullif(btrim(p_subject), '') as subject
  ),
  filtered as (
    select q.*, (select count(*) from public.questions x where x.quiz_id = q.id) as question_count
      from public.quizzes q, params
     where q.is_public = true
       and (params.subject is null or q.subject = params.subject)
       and (
         params.search is null
         or extensions.unaccent(lower(q.title || ' ' || coalesce(q.subject, '') || ' ' || coalesce(q.description, '')))
            like '%' || replace(replace(replace(extensions.unaccent(lower(params.search)), '\', '\\'), '%', '\%'), '_', '\_') || '%'
       )
  )
  select f.id, f.title, f.subject, f.description, f.play_count, f.like_count, f.question_count, f.created_at,
         f.owner_id, coalesce(nullif(p.display_name, ''), p.username), p.avatar_url, p.username, count(*) over ()
    from filtered f
    join public.profiles p on p.id = f.owner_id
   where f.question_count > 0
   order by case p_sort when 'new' then 0 when 'liked' then f.like_count else f.play_count end desc,
            case when p_sort = 'liked' then f.play_count else 0 end desc,
            f.created_at desc
   limit least(greatest(coalesce(p_limit, 24), 1), 60)
  offset greatest(coalesce(p_offset, 0), 0);
$$;
grant execute on function public.explore_quizzes(text, text, text, integer, integer) to anon, authenticated;

-- ── 9. Xếp hạng: thêm bảng "được theo dõi nhiều nhất" ───────────────────
create or replace function public.leaderboard(
  p_kind   text    default 'learners',   -- 'learners' | 'creators' | 'followed'
  p_period text    default 'week',
  p_limit  integer default 20
)
returns table (
  rank bigint, user_id uuid, display_name text, avatar_url text, username text, score bigint, extra bigint
)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_since timestamptz := case p_period
    when 'week'  then now() - interval '7 days'
    when 'month' then now() - interval '30 days'
    else '-infinity'::timestamptz
  end;
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 100);
begin
  if p_kind = 'followed' then
    -- số người theo dõi mới trong kỳ (tất cả: tổng số người theo dõi), phụ: tổng số người theo dõi
    return query
      with stats as (
        select f.following_id as uid, count(*) as gained
          from public.follows f
         where f.created_at >= v_since
         group by f.following_id
      )
      select rank() over (order by s.gained desc, p.follower_count desc),
             p.id, coalesce(nullif(p.display_name, ''), p.username), p.avatar_url, p.username,
             s.gained::bigint, p.follower_count::bigint
        from stats s
        join public.profiles p on p.id = s.uid
       order by s.gained desc, p.follower_count desc, p.id
       limit v_limit;
  elsif p_kind = 'creators' then
    return query
      with stats as (
        select q.owner_id as uid, count(*) as quizzes, coalesce(sum(q.play_count), 0) as plays
          from public.quizzes q
         where q.is_public = true
           and q.created_at >= v_since
           and exists (select 1 from public.questions x where x.quiz_id = q.id)
         group by q.owner_id
      )
      select rank() over (order by s.quizzes desc, s.plays desc),
             p.id, coalesce(nullif(p.display_name, ''), p.username), p.avatar_url, p.username,
             s.quizzes::bigint, s.plays::bigint
        from stats s
        join public.profiles p on p.id = s.uid
       order by s.quizzes desc, s.plays desc, p.id
       limit v_limit;
  else
    return query
      with stats as (
        select r.user_id as uid, coalesce(sum(r.total), 0) as answered, count(*) as attempts
          from public.results r
         where r.user_id is not null
           and r.completed_at >= v_since
         group by r.user_id
      )
      select rank() over (order by s.answered desc, s.attempts desc),
             p.id, coalesce(nullif(p.display_name, ''), p.username), p.avatar_url, p.username,
             s.answered::bigint, s.attempts::bigint
        from stats s
        join public.profiles p on p.id = s.uid
       order by s.answered desc, s.attempts desc, p.id
       limit v_limit;
  end if;
end;
$$;
revoke all on function public.leaderboard(text, text, integer) from public;
grant execute on function public.leaderboard(text, text, integer) to anon, authenticated;
