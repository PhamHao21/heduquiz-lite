-- 007: trang Khám phá (đề công khai) + Bảng xếp hạng
-- Chạy trong Supabase → SQL Editor SAU 006. An toàn khi chạy lại.

-- Tìm kiếm không dấu: "lich su" khớp "Lịch sử".
create extension if not exists unaccent with schema extensions;

-- ── 1. explore_quizzes: danh sách đề công khai có tìm kiếm / lọc / sắp xếp / phân trang ──
-- Chạy với quyền người gọi (kể cả khách chưa đăng nhập); chỉ trả về đề công khai có câu hỏi.
create or replace function public.explore_quizzes(
  p_search  text    default null,
  p_subject text    default null,
  p_sort    text    default 'popular',   -- 'popular' | 'new'
  p_limit   integer default 24,
  p_offset  integer default 0
)
returns table (
  id             uuid,
  title          text,
  subject        text,
  description    text,
  play_count     integer,
  question_count bigint,
  created_at     timestamptz,
  owner_id       uuid,
  owner_name     text,
  owner_avatar   text,
  total_count    bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with params as (
    select nullif(btrim(p_search), '') as search,
           nullif(btrim(p_subject), '') as subject
  ),
  filtered as (
    select q.*,
           (select count(*) from public.questions x where x.quiz_id = q.id) as question_count
      from public.quizzes q, params
     where q.is_public = true
       and (params.subject is null or q.subject = params.subject)
       and (
         params.search is null
         or extensions.unaccent(lower(q.title || ' ' || coalesce(q.subject, '') || ' ' || coalesce(q.description, '')))
            like '%' || replace(replace(replace(extensions.unaccent(lower(params.search)), '\', '\\'), '%', '\%'), '_', '\_') || '%'
       )
  )
  select f.id,
         f.title,
         f.subject,
         f.description,
         f.play_count,
         f.question_count,
         f.created_at,
         f.owner_id,
         coalesce(nullif(p.display_name, ''), p.username),
         p.avatar_url,
         count(*) over ()
    from filtered f
    join public.profiles p on p.id = f.owner_id
   where f.question_count > 0
   order by case when p_sort = 'new' then 0 else f.play_count end desc,
            f.created_at desc
   limit least(greatest(coalesce(p_limit, 24), 1), 60)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

grant execute on function public.explore_quizzes(text, text, text, integer, integer) to anon, authenticated;

-- ── 2. leaderboard: bảng xếp hạng ────────────────────────────────────────
-- 'learners': số câu đã làm (tổng các lượt nộp bài) + số lượt; 'creators': số đề công khai + tổng lượt ôn.
-- security definer vì phải đếm kết quả của mọi người (RLS chỉ cho xem kết quả của mình),
-- nhưng chỉ trả về tên hiển thị, ảnh đại diện và các con số tổng — không lộ điểm hay bài làm.
create or replace function public.leaderboard(
  p_kind   text    default 'learners',   -- 'learners' | 'creators'
  p_period text    default 'week',       -- 'week' | 'month' | 'all'
  p_limit  integer default 20
)
returns table (
  rank         bigint,
  user_id      uuid,
  display_name text,
  avatar_url   text,
  score        bigint,   -- learners: số câu đã làm · creators: số đề công khai
  extra        bigint    -- learners: số lượt làm bài · creators: tổng lượt ôn các đề
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_since timestamptz := case p_period
    when 'week'  then now() - interval '7 days'
    when 'month' then now() - interval '30 days'
    else '-infinity'::timestamptz
  end;
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 100);
begin
  if p_kind = 'creators' then
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
             p.id, coalesce(nullif(p.display_name, ''), p.username), p.avatar_url,
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
             p.id, coalesce(nullif(p.display_name, ''), p.username), p.avatar_url,
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
