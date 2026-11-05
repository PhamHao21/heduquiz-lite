-- 005: lưu giải thích đáp án (cột questions.explanation) khi lưu đề
-- Chạy trong Supabase → SQL Editor SAU 004. An toàn khi chạy lại.
-- Giống save_quiz ở 004 (giữ id câu hỏi khi sửa đề), thêm việc lưu "explanation"
-- lấy từ dòng "> ..." hoặc "Giải thích: ..." trong văn bản đề.
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
  end if;

  -- Ghép câu mới với câu cũ theo nội dung (câu trùng nội dung thì ghép theo thứ tự xuất hiện),
  -- rồi: xoá câu cũ không còn trong đề, cập nhật câu khớp (giữ id), thêm câu mới.
  with new_q as (
    select t.q,
           t.ord,
           t.q->>'content' as content,
           row_number() over (partition by t.q->>'content' order by t.ord) as dup_rank
      from jsonb_array_elements(p_questions) with ordinality as t(q, ord)
  ),
  old_q as (
    select id,
           content,
           row_number() over (partition by content order by position, created_at, id) as dup_rank
      from public.questions
     where quiz_id = v_id
  ),
  matched as (
    select n.q, n.ord, n.content, o.id as old_id
      from new_q n
      left join old_q o on o.content = n.content and o.dup_rank = n.dup_rank
  ),
  removed as (
    delete from public.questions q
     where q.quiz_id = v_id
       and not exists (select 1 from matched m where m.old_id = q.id)
    returning 1
  ),
  updated as (
    update public.questions q
       set position    = m.ord,
           options     = m.q->'options',
           multi       = coalesce((m.q->>'multi')::boolean, false),
           explanation = nullif(btrim(m.q->>'explanation'), '')
      from matched m
     where q.id = m.old_id
    returning 1
  )
  insert into public.questions (quiz_id, position, content, options, multi, explanation)
  select v_id, m.ord, m.content, m.q->'options', coalesce((m.q->>'multi')::boolean, false),
         nullif(btrim(m.q->>'explanation'), '')
    from matched m
   where m.old_id is null;

  return v_id;
end;
$$;

revoke all on function public.save_quiz(uuid, text, text, text, boolean, jsonb, jsonb) from public;
grant execute on function public.save_quiz(uuid, text, text, text, boolean, jsonb, jsonb) to authenticated;
