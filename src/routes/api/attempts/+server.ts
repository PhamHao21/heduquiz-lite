// src/routes/api/attempts/+server.ts
// Lưu lịch sử làm bài (alias của results, dùng cho client-side fetch)
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  const { session } = await locals.safeGetSession();

  const body = await request.json().catch(() => null);
  if (!body?.quiz_id) throw error(400, 'Missing quiz_id');

  const { error: err } = await locals.supabase.from('results').insert({
    quiz_id:    body.quiz_id,
    user_id:    session?.user.id ?? null,
    score:      body.score   ?? 0,
    total:      body.total   ?? 0,
    time_spent: body.time_spent ?? null,
    answers:    body.answers ?? []
  });

  if (err) throw error(500, err.message);
  return json({ ok: true });
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
