// src/routes/kho-de/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession();
  if (!session) throw redirect(303, '/auth?next=/kho-de');

  const { data: quizzes } = await locals.supabase
    .from('quizzes')
    .select('id, title, subject, is_public, play_count, created_at, updated_at')
    .eq('owner_id', session.user.id)
    .order('updated_at', { ascending: false });

  const { count: totalAttempts } = await locals.supabase
    .from('results')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id);

  return {
    quizzes: quizzes ?? [],
    stats: {
      totalQuizzes:  quizzes?.length ?? 0,
      totalAttempts: totalAttempts ?? 0
    }
  };
};
