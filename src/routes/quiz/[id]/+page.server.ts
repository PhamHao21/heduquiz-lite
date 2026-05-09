// src/routes/quiz/[id]/+page.server.ts
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  const { session } = await locals.safeGetSession();

  const { data: quiz, error: quizErr } = await locals.supabase
    .from('quizzes')
    // Thêm sections vào select
    .select('id, title, description, subject, is_public, owner_id, play_count, created_at, sections')
    .eq('id', params.id)
    .single();

  if (quizErr || !quiz) throw error(404, 'Không tìm thấy đề thi');

  // Chỉ owner hoặc quiz public mới được xem
  if (!quiz.is_public && quiz.owner_id !== session?.user.id) {
    throw redirect(303, '/auth');
  }

  const { data: questions } = await locals.supabase
    .from('questions')
    .select('id, position, content, options, multi')
    .eq('quiz_id', params.id)
    .order('position', { ascending: true });

  // Lịch sử làm bài của user này (nếu đã login)
  let history: { id: string; score: number; total: number; time_spent: number | null; completed_at: string }[] = [];
  if (session) {
    const { data } = await locals.supabase
      .from('results')
      .select('id, score, total, time_spent, completed_at')
      .eq('quiz_id', params.id)
      .eq('user_id', session.user.id)
      .order('completed_at', { ascending: false })
      .limit(5);
    history = data ?? [];
  }

  // Tăng play_count (fire-and-forget, không block response)
  locals.supabase
    .from('quizzes')
    .update({ play_count: (quiz.play_count ?? 0) + 1 })
    .eq('id', params.id)
    .then(() => {});

  return {
    quiz,
    questions: questions ?? [],
    history,
    isOwner: quiz.owner_id === session?.user.id
  };
};
