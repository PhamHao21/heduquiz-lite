-- 006: tiến độ ôn tập theo từng đề cho trang "Kho đề"
-- Chạy trong Supabase → SQL Editor SAU 005. An toàn khi chạy lại.
--
-- Trả về mỗi đề mà người dùng hiện tại đã làm: số lượt làm, lần làm gần nhất, điểm lần
-- gần nhất và số "câu cần ôn" (trả lời SAI ở lần gần nhất gặp câu đó — cùng quy tắc với
-- trang đề). Chỉ tính các câu còn trong đề. Chạy với quyền người gọi nên RLS vẫn áp dụng:
-- đề người khác đã chuyển sang riêng tư sẽ không còn xuất hiện.
create or replace function public.my_quiz_progress()
returns table (
  quiz_id         uuid,
  title           text,
  subject         text,
  is_owner        boolean,
  attempts        bigint,
  last_attempt_at timestamptz,
  last_score      integer,
  last_total      integer,
  needs_review    bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with mine as (
    select r.quiz_id, r.score, r.total, r.completed_at, r.answers
      from public.results r
     where r.user_id = auth.uid()
  ),
  per_answer as (
    select m.quiz_id,
           a->>'question_id' as question_id,
           (a->>'is_correct')::boolean as is_correct,
           row_number() over (
             partition by m.quiz_id, a->>'question_id'
             order by m.completed_at desc
           ) as rn
      from mine m
     cross join lateral jsonb_array_elements(
             case when jsonb_typeof(m.answers) = 'array' then m.answers else '[]'::jsonb end
           ) a
     where jsonb_typeof(a) = 'object'
       and jsonb_typeof(a->'is_correct') = 'boolean'
  ),
  review as (
    select pa.quiz_id, count(*) filter (where not pa.is_correct) as needs_review
      from per_answer pa
      join public.questions q
        on q.id::text = pa.question_id
       and q.quiz_id = pa.quiz_id
     where pa.rn = 1
     group by pa.quiz_id
  ),
  agg as (
    select m.quiz_id, count(*) as attempts, max(m.completed_at) as last_attempt_at
      from mine m
     group by m.quiz_id
  ),
  last_result as (
    select distinct on (m.quiz_id) m.quiz_id, m.score::integer as score, m.total::integer as total
      from mine m
     order by m.quiz_id, m.completed_at desc
  )
  select z.id,
         z.title,
         z.subject,
         z.owner_id = auth.uid(),
         a.attempts,
         a.last_attempt_at,
         l.score,
         l.total,
         coalesce(rv.needs_review, 0)
    from agg a
    join public.quizzes z on z.id = a.quiz_id
    join last_result l on l.quiz_id = a.quiz_id
    left join review rv on rv.quiz_id = a.quiz_id
   order by a.last_attempt_at desc;
$$;

-- Supabase mặc định cấp quyền chạy hàm cho cả anon → gỡ ra, chỉ người đã đăng nhập mới gọi được.
revoke all on function public.my_quiz_progress() from public, anon;
grant execute on function public.my_quiz_progress() to authenticated;

-- save_quiz (003–005) cũng chỉ dành cho người đã đăng nhập (trong hàm đã kiểm tra, gỡ thêm cho chắc).
revoke all on function public.save_quiz(uuid, text, text, text, boolean, jsonb, jsonb) from anon;
