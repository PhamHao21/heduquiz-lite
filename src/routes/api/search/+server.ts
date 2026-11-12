// src/routes/api/search/+server.ts
// Gợi ý nhanh cho bảng tìm kiếm Ctrl+K: vài kết quả mỗi loại.
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchAll } from '$lib/server/search';

export const GET: RequestHandler = async ({ locals, url }) => {
  const q = (url.searchParams.get('q') ?? '').trim();
  if (q.length < 2) return json({ quizzes: [], quizTotal: 0, mine: [], people: [], collections: [] });
  const { user } = await locals.safeGetSession();
  const results = await searchAll(locals.supabase, q, user?.id, { quizzes: 5, mine: 4, people: 4, collections: 3 });
  return json(results, { headers: { 'cache-control': 'private, max-age=30' } });
};
