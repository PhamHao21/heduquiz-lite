// src/routes/lich-su/+page.server.ts
// Lịch sử làm bài của người đang đăng nhập (mới nhất trước), có phân trang.
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 30;

export interface HistoryRow {
  id: string; score: number; total: number; time_spent: number | null; completed_at: string; quiz_id: string;
  quiz: { title: string; subject: string | null } | null;
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const { user } = await locals.safeGetSession();
  if (!user) throw redirect(303, '/auth?next=/lich-su');

  const page = Math.max(1, Math.min(200, Math.floor(Number(url.searchParams.get('trang')) || 1)));
  const from = (page - 1) * PAGE_SIZE;

  const { data, count } = await locals.supabase
    .from('results')
    .select('id, score, total, time_spent, completed_at, quiz_id, quiz:quizzes(title, subject)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  return {
    rows: (data ?? []) as unknown as HistoryRow[],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE
  };
};
