-- 003: lưu đề trong một transaction + chấm điểm phía server
-- Chạy trong Supabase → SQL Editor SAU 001 và 002. An toàn khi chạy lại.

-- ── 1. Chuẩn hoá dữ liệu câu hỏi đã lưu ──────────────────────────────────
-- Parser mới luôn đặt nhãn đáp án theo vị trí (A, B, C…). Đưa dữ liệu cũ về
-- cùng quy tắc để việc chấm điểm theo nhãn luôn đúng (dữ liệu cũ có thể có
-- nhãn rỗng hoặc trùng nhau), và đánh dấu câu có ≥ 2 đáp án đúng là nhiều đáp án.
update public.questions q
   set options = sub.new_options,
       multi   = q.multi or sub.correct_count > 1
  from (
    select qq.id,
           jsonb_agg(t.o || jsonb_build_object('label', chr(64 + t.i::int)) order by t.i) as new_options,
           count(*) filter (where (t.o->>'is_correct')::boolean) as correct_count
      from public.questions qq,
           jsonb_array_elements(qq.options) with ordinality as t(o, i)
     group by qq.id
  ) sub
 where sub.id = q.id;

-- Đánh lại position liên tục 1..n trong từng đề (dữ liệu cũ có thể bị nhảy số).
update public.questions q
   set position = sub.rn
  from (
    select id, row_number() over (partition by quiz_id order by position, created_at, id) as rn
      from public.questions
  ) sub
 where sub.id = q.id
   and q.position is distinct from sub.rn;

-- ── 2. save_quiz: tạo/sửa đề + toàn bộ câu hỏi trong MỘT transaction ──────
-- Lỗi ở bất kỳ bước nào thì không có gì thay đổi (không còn cảnh đề bị xoá
-- trắng câu hỏi). Chạy với quyền của người gọi nên RLS vẫn áp dụng.
create or replace function public.save_quiz(
  p_quiz_id   uuid,
  p_title     text,
  p_subject   text,
  p_raw_text  text,
  p_is_public boolean,
  p_sections  jsonb,
  p_questions jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'Bạn cần đăng nhập để lưu đề' using errcode = '28000';
  end if;
  if coalesce(btrim(p_title), '') = '' then
    raise exception 'Tên đề không được để trống' using errcode = '22023';
  end if;
  if jsonb_typeof(p_questions) is distinct from 'array' or jsonb_array_length(p_questions) = 0 then
    raise exception 'Đề phải có ít nhất 1 câu hỏi hợp lệ' using errcode = '22023';
  end if;
  if jsonb_array_length(p_questions) > 2000 then
    raise exception 'Một đề tối đa 2000 câu hỏi' using errcode = '22023';
  end if;

  if p_quiz_id is null then
    insert into public.quizzes (owner_id, title, subject, raw_text, is_public, sections)
    values (v_uid, btrim(p_title), p_subject, p_raw_text, coalesce(p_is_public, false), p_sections)
    returning id into v_id;
  else
    update public.quizzes
       set title     = btrim(p_title),
           subject   = p_subject,
           raw_text  = p_raw_text,
           is_public = coalesce(p_is_public, false),
           sections  = p_sections
     where id = p_quiz_id
       and owner_id = v_uid
    returning id into v_id;

    if v_id is null then
      raise exception 'Không tìm thấy đề hoặc bạn không có quyền sửa đề này' using errcode = '42501';
    end if;

    delete from public.questions where quiz_id = v_id;
  end if;

  insert into public.questions (quiz_id, position, content, options, multi)
  select v_id,
         row_number() over (order by t.ord),
         t.q->>'content',
         t.q->'options',
         coalesce((t.q->>'multi')::boolean, false)
    from jsonb_array_elements(p_questions) with ordinality as t(q, ord);

  return v_id;
end;
$$;

revoke all on function public.save_quiz(uuid, text, text, text, boolean, jsonb, jsonb) from public;
grant execute on function public.save_quiz(uuid, text, text, text, boolean, jsonb, jsonb) to authenticated;

-- ── 3. submit_attempt: chấm điểm trên server khi nộp bài ─────────────────
-- Client chỉ gửi đáp án đã chọn; điểm được tính từ đáp án đúng trong DB,
-- nên không thể tự gửi điểm giả (cần cho bảng xếp hạng sau này).
-- Đồng thời tăng play_count. Khách chưa đăng nhập: chỉ tăng lượt ôn, không lưu kết quả.
create or replace function public.submit_attempt(
  p_quiz_id    uuid,
  p_answers    jsonb,
  p_time_spent integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_graded jsonb;
  v_score  integer;
  v_total  integer;
  v_saved  boolean := false;
begin
  if not exists (
    select 1 from public.quizzes
     where id = p_quiz_id and (is_public = true or owner_id = v_uid)
  ) then
    raise exception 'Không tìm thấy đề thi' using errcode = 'P0002';
  end if;
  if jsonb_typeof(p_answers) is distinct from 'array' then
    raise exception 'Dữ liệu bài làm không hợp lệ' using errcode = '22023';
  end if;

  update public.quizzes set play_count = play_count + 1 where id = p_quiz_id;

  with submitted as (
    select distinct on (a->>'question_id')
           a->>'question_id' as question_id,
           case when jsonb_typeof(a->'chosen') = 'array' then a->'chosen' else '[]'::jsonb end as chosen
      from jsonb_array_elements(p_answers) a
     where jsonb_typeof(a) = 'object'
  ),
  graded as (
    select q.id,
           q.position,
           coalesce((select jsonb_agg(distinct x order by x)
                       from jsonb_array_elements_text(s.chosen) x), '[]'::jsonb) as chosen,
           coalesce((select jsonb_agg(o->>'label' order by o->>'label')
                       from jsonb_array_elements(q.options) o
                      where (o->>'is_correct')::boolean), '[]'::jsonb) as correct
      from submitted s
      join public.questions q
        on q.id::text = s.question_id
       and q.quiz_id = p_quiz_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'question_id', id,
           'chosen',      chosen,
           'correct',     correct,
           'is_correct',  chosen = correct
         ) order by position), '[]'::jsonb),
         count(*) filter (where chosen = correct),
         count(*)
    into v_graded, v_score, v_total
    from graded;

  if v_uid is not null and v_total > 0 then
    insert into public.results (quiz_id, user_id, score, total, time_spent, answers)
    values (
      p_quiz_id, v_uid, v_score, v_total,
      case when p_time_spent is null then null else greatest(0, least(p_time_spent, 86400)) end,
      v_graded
    );
    v_saved := true;
  end if;

  return jsonb_build_object('score', v_score, 'total', v_total, 'saved', v_saved);
end;
$$;

revoke all on function public.submit_attempt(uuid, jsonb, integer) from public;
grant execute on function public.submit_attempt(uuid, jsonb, integer) to anon, authenticated;

-- Kết quả giờ chỉ được ghi qua submit_attempt (đã chấm điểm trên server).
drop policy if exists "results: authenticated insert" on public.results;

-- increment_play_count (migration 002) đã được gộp vào submit_attempt.
drop function if exists public.increment_play_count(uuid);
