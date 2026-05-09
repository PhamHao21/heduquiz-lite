// src/routes/api/results/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** POST /api/results — save attempt */
export const POST: RequestHandler = async ({ request, locals }) => {
  const { session } = await locals.safeGetSession();

  const body = await request.json().catch(() => null);
  if (!body?.quiz_id) throw error(400, 'Missing quiz_id');

  const { error: err } = await locals.supabase.from('results').insert({
    quiz_id:    body.quiz_id,
    user_id:    session?.user.id ?? null,
    score:      body.score,
    total:      body.total,
    time_spent: body.time_spent ?? null,
    answers:    body.answers ?? []
  });

  if (err) throw error(500, err.message);
  return json({ ok: true });
};

/** GET /api/results?quiz_id=X — results for a quiz (owner only) */
export const GET: RequestHandler = async ({ url, locals }) => {
  const { session } = await locals.safeGetSession();
  if (!session) throw error(401, 'Unauthorized');

  const quizId = url.searchParams.get('quiz_id');
  if (!quizId) throw error(400, 'Missing quiz_id');

  const { data, error: err } = await locals.supabase
    .from('results')
    .select('id, score, total, time_spent, completed_at, profiles(username, display_name)')
    .eq('quiz_id', quizId)
    .order('score', { ascending: false })
    .limit(50);

  if (err) throw error(500, err.message);
  return json(data ?? []);
};
