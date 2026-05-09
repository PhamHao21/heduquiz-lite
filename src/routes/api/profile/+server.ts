// src/routes/api/profiles/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/** PATCH /api/profile — update own profile */
export const PATCH = async (event: RequestEvent) => {
  const { request, locals } = event;
  const { session } = await locals.safeGetSession();
  if (!session) throw error(401, 'Unauthorized');

  const body = await request.json().catch(() => null);
  if (!body) throw error(400, 'Invalid body');

  const allowed = ['display_name', 'bio', 'avatar_url'];
  const patch: Record<string, string> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) patch[key] = body[key];
  }

  const { data, error: err } = await locals.supabase
    .from('profiles')
    .update(patch)
    .eq('id', session.user.id)
    .select()
    .single();

  if (err) throw error(500, err.message);
  return json(data);
};
