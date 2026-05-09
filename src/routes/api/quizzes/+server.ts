// src/routes/api/quizzes/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  const { session } = await locals.safeGetSession();
  if (!session) throw error(401, 'Unauthorized');

  const { data, error: err } = await locals.supabase
    .from('quizzes')
    .select('id, title, subject, is_public, play_count, created_at, updated_at')
    .eq('owner_id', session.user.id)
    .order('updated_at', { ascending: false });

  if (err) throw error(500, err.message);
  return json(data ?? []);
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
  const { session } = await locals.safeGetSession();
  if (!session) throw error(401, 'Unauthorized');

  const body = await request.json().catch(() => null);
  if (!body?.id) throw error(400, 'Missing id');

  const allowed = ['title', 'description', 'subject', 'is_public', 'raw_text'] as const;
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) patch[key] = body[key];
  }

  const { data, error: err } = await locals.supabase
    .from('quizzes')
    .update(patch)
    .eq('id', body.id)
    .eq('owner_id', session.user.id)
    .select()
    .single();

  if (err) throw error(500, err.message);
  return json(data);
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
  const { session } = await locals.safeGetSession();
  if (!session) throw error(401, 'Unauthorized');

  const { id } = await request.json();
  if (!id) throw error(400, 'Missing id');

  const { error: err } = await locals.supabase
    .from('quizzes')
    .delete()
    .eq('id', id)
    .eq('owner_id', session.user.id);

  if (err) throw error(500, err.message);
  return json({ ok: true });
};
