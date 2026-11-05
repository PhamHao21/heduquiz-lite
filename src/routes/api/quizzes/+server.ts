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

  // Chỉ cho sửa thông tin đề; câu hỏi được lưu qua RPC save_quiz (migration 003).
  const patch: Record<string, unknown> = {};
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) throw error(400, 'Tên đề không hợp lệ');
    patch.title = body.title.trim().slice(0, 200);
  }
  for (const key of ['description', 'subject'] as const) {
    if (body[key] === undefined) continue;
    if (body[key] !== null && typeof body[key] !== 'string') throw error(400, `${key} không hợp lệ`);
    patch[key] = body[key];
  }
  if (body.is_public !== undefined) {
    if (typeof body.is_public !== 'boolean') throw error(400, 'is_public không hợp lệ');
    patch.is_public = body.is_public;
  }
  if (Object.keys(patch).length === 0) throw error(400, 'Không có gì để cập nhật');

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

  const body = await request.json().catch(() => null);
  const id = body?.id;
  if (!id || typeof id !== 'string') throw error(400, 'Missing id');

  const { error: err } = await locals.supabase
    .from('quizzes')
    .delete()
    .eq('id', id)
    .eq('owner_id', session.user.id);

  if (err) throw error(500, err.message);
  return json({ ok: true });
};
