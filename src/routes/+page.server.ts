// src/routes/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { ExploreQuiz } from './kham-pha/+page.server';
import { suggestedAuthors } from '$lib/server/social';

export const load: PageServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession();
  // Đã đăng nhập → vào kho đề ngay
  if (session) throw redirect(303, '/kho-de');

  // Vài đề công khai phổ biến để khách xem thử (bỏ qua nếu chưa chạy migration 007)
  const [{ data }, authors] = await Promise.all([
    locals.supabase.rpc('explore_quizzes', { p_sort: 'popular', p_limit: 6, p_offset: 0 }),
    suggestedAuthors(locals.supabase, 4)
  ]);
  return { popular: (data ?? []) as ExploreQuiz[], authors };
};
