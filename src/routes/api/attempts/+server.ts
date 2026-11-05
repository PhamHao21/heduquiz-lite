// src/routes/api/attempts/+server.ts
// Nộp bài: server chấm điểm từ đáp án đúng trong DB (RPC submit_attempt, migration 003),
// tăng lượt ôn, và lưu lịch sử nếu đã đăng nhập.
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const MAX_ANSWERS = 2000;
const MAX_CHOICES = 26;

export const POST: RequestHandler = async ({ request, locals }) => {
  // Gọi để Supabase client nạp/làm mới phiên đăng nhập từ cookie (khách thì bỏ qua).
  await locals.safeGetSession();

  const body = await request.json().catch(() => null);
  if (!body || typeof body.quiz_id !== 'string' || !Array.isArray(body.answers)) {
    throw error(400, 'Dữ liệu bài làm không hợp lệ');
  }

  // Chỉ gửi lên đúng những gì cần để chấm: id câu hỏi + nhãn đã chọn.
  const answers = (body.answers as unknown[]).slice(0, MAX_ANSWERS).map(a => {
    const item = (a ?? {}) as { question_id?: unknown; chosen?: unknown };
    return {
      question_id: String(item.question_id ?? ''),
      chosen: Array.isArray(item.chosen) ? item.chosen.slice(0, MAX_CHOICES).map(String) : []
    };
  });
  const timeSpent = Number.isFinite(body.time_spent) ? Math.max(0, Math.round(body.time_spent)) : null;

  const { data, error: err } = await locals.supabase.rpc('submit_attempt', {
    p_quiz_id: body.quiz_id,
    p_answers: answers,
    p_time_spent: timeSpent
  });

  if (err) {
    if (err.code === 'P0002' || err.code === '22P02') throw error(404, 'Không tìm thấy đề thi');
    if (err.code === '22023') throw error(400, err.message);
    console.error('submit_attempt failed:', err);
    throw error(500, 'Không lưu được kết quả');
  }
  return json(data as { score: number; total: number; saved: boolean });
};

export const GET: RequestHandler = async ({ url, locals }) => {
  const { session } = await locals.safeGetSession();
  if (!session) throw error(401, 'Unauthorized');

  const quizId = url.searchParams.get('quiz_id');

  let q = locals.supabase
    .from('results')
    .select('id, score, total, time_spent, completed_at, quiz_id, quizzes(title)')
    .eq('user_id', session.user.id)
    .order('completed_at', { ascending: false })
    .limit(20);

  if (quizId) q = q.eq('quiz_id', quizId);

  const { data, error: err } = await q;
  if (err) throw error(500, err.message);
  return json(data ?? []);
};
