// src/routes/kho-de/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export interface QuizProgressRow {
  quiz_id: string;
  title: string;
  subject: string | null;
  is_owner: boolean;
  attempts: number;
  last_attempt_at: string;
  last_score: number;
  last_total: number;
  needs_review: number;
}

export const load: PageServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession();
  if (!session) throw redirect(303, '/auth?next=/kho-de');

  const [{ data: quizzes }, { count: totalAttempts }, progressRes] = await Promise.all([
    locals.supabase
      .from('quizzes')
      .select('id, title, subject, is_public, play_count, created_at, updated_at')
      .eq('owner_id', session.user.id)
      .order('updated_at', { ascending: false }),
    locals.supabase
      .from('results')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id),
    // Tiến độ ôn tập theo đề (migration 006). Chưa chạy migration thì bỏ qua, trang vẫn hoạt động.
    locals.supabase.rpc('my_quiz_progress')
  ]);

  if (progressRes.error) console.error('my_quiz_progress failed:', progressRes.error.message);
  const progress = (progressRes.data ?? []) as QuizProgressRow[];

  return {
    quizzes: quizzes ?? [],
    progress,
    stats: {
      totalQuizzes:  quizzes?.length ?? 0,
      totalAttempts: totalAttempts ?? 0,
      needsReview:   progress.reduce((sum, p) => sum + Number(p.needs_review), 0)
    }
  };
};
