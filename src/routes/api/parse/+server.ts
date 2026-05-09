import { json, error } from '@sveltejs/kit';
import { parseQuizText } from '$lib/server/parser';
import type { RequestEvent } from '@sveltejs/kit';

export const POST = async (event: RequestEvent) => {
  const { request, locals } = event;
  const { session } = await locals.safeGetSession();
  if (!session) throw error(401, 'Unauthorized');

  const body = await request.json().catch(() => null);
  if (!body?.text) throw error(400, 'Missing text');

  const result = parseQuizText(body.text as string);
  return json(result);
};
