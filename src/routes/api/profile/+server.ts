// src/routes/api/profile/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

const LIMITS = { display_name: 60, bio: 300, avatar_url: 500 } as const;

/** PATCH /api/profile — update own profile */
export const PATCH = async (event: RequestEvent) => {
  const { request, locals } = event;
  const { session } = await locals.safeGetSession();
  if (!session) throw error(401, 'Unauthorized');

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') throw error(400, 'Invalid body');

  const patch: Record<string, string | null> = {};
  for (const key of Object.keys(LIMITS) as (keyof typeof LIMITS)[]) {
    const value = body[key];
    if (value === undefined) continue;
    if (value !== null && typeof value !== 'string') throw error(400, `${key} phải là chuỗi`);
    const trimmed = value?.trim() ?? '';
    if (trimmed.length > LIMITS[key]) throw error(400, `${key} tối đa ${LIMITS[key]} ký tự`);
    if (key === 'avatar_url' && trimmed && !/^https:\/\//i.test(trimmed)) {
      throw error(400, 'avatar_url phải là link https://');
    }
    patch[key] = trimmed || null;
  }
  if (patch.display_name === null) throw error(400, 'Tên hiển thị không được để trống');
  if (Object.keys(patch).length === 0) throw error(400, 'Không có gì để cập nhật');

  const { data, error: err } = await locals.supabase
    .from('profiles')
    .update(patch)
    .eq('id', session.user.id)
    .select()
    .single();

  if (err) throw error(500, err.message);
  return json(data);
};
