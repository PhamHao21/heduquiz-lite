// src/routes/quiz/[id]/in/+page.server.ts
// Bản in / xuất file của một đề (đề công khai hoặc đề của chính mình).
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  const { session } = await locals.safeGetSession();

  const { data: quiz } = await locals.supabase
    .from('quizzes')
    .select('id, title, subject, description, is_public, owner_id')
    .eq('id', params.id)
    .maybeSingle();

  if (!quiz) {
    if (!session) throw redirect(303, `/auth?next=${encodeURIComponent(`/quiz/${params.id}/in`)}`);
    throw error(404, 'Không tìm thấy đề thi');
  }
  if (!quiz.is_public && quiz.owner_id !== session?.user.id) throw error(404, 'Không tìm thấy đề thi');

  const { data: questions } = await locals.supabase
    .from('questions')
    .select('id, content, options, multi, explanation')
    .eq('quiz_id', params.id)
    .order('position', { ascending: true });

  return { quiz, questions: questions ?? [] };
};
