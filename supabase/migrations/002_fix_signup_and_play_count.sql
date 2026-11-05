-- 002: sửa lỗi đăng ký trùng username + đếm lượt ôn (play_count) nguyên tử
-- Chạy file này trong Supabase → SQL Editor sau 001_initial_schema.sql.
-- An toàn khi chạy lại nhiều lần (create or replace).

-- ── 1. Tạo profile khi đăng ký: không lỗi khi trùng username ─────────────
-- Trước đây username = phần trước "@" của email, mà cột username là unique,
-- nên "an@gmail.com" đã tồn tại thì "an@yahoo.com" không đăng ký được.
-- Giờ nếu trùng sẽ thêm hậu tố lấy từ user id (VD: an_3f9a1c).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate     text;
  suffix_len    int := 6;
begin
  base_username := coalesce(
    nullif(new.raw_user_meta_data->>'user_name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'user'
  );
  candidate := base_username;

  while exists (select 1 from public.profiles where username = candidate) loop
    candidate := base_username || '_' || left(replace(new.id::text, '-', ''), suffix_len);
    suffix_len := suffix_len + 2;  -- vẫn trùng thì lấy hậu tố dài hơn
    if suffix_len > 32 then
      candidate := base_username || '_' || replace(new.id::text, '-', '');
      exit;
    end if;
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    candidate,
    coalesce(new.raw_user_meta_data->>'full_name', base_username),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- ── 2. Tăng play_count nguyên tử, gọi khi nộp bài ─────────────────────────
-- RLS chỉ cho chủ đề UPDATE bảng quizzes, nên trước đây người khác ôn đề
-- thì play_count không tăng. Hàm security definer này chỉ tăng đúng cột
-- play_count, và chỉ với đề công khai hoặc đề của chính người gọi.
create or replace function public.increment_play_count(p_quiz_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.quizzes
     set play_count = play_count + 1
   where id = p_quiz_id
     and (is_public = true or owner_id = auth.uid());
$$;

revoke all on function public.increment_play_count(uuid) from public;
grant execute on function public.increment_play_count(uuid) to anon, authenticated;

-- Không cập nhật updated_at khi chỉ tăng lượt ôn, để danh sách "Kho đề"
-- (sắp theo updated_at) không bị đảo thứ tự mỗi lần có người ôn đề.
drop trigger if exists trg_quizzes_updated_at on public.quizzes;
create trigger trg_quizzes_updated_at
  before update on public.quizzes
  for each row
  when (old.play_count is not distinct from new.play_count)
  execute procedure public.handle_updated_at();
