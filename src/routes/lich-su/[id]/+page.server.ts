// src/routes/lich-su/[id]/+page.server.ts
// Xem lại một lượt làm bài của chính mình: từng câu, đáp án đã chọn, đáp án đúng, giải thích.
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export interface ReviewQuestion {
  id: string; content: string; multi: boolean; explanation: string | null;
  options: { label: string; text: string; is_correct: boolean }[];
}

export const load: PageServerLoad = async ({ locals, params }) => {
  const { user } = await locals.safeGetSession();
  if (!user) throw redirect(303, `/auth?next=${encodeURIComponent(`/lich-su/${params.id}`)}`);

  const { data: result } = await locals.supabase
    .from('results')
    .select('id, score, total, time_spent, completed_at, answers, quiz_id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!result) throw error(404, 'Không tìm thấy lượt làm bài này');

  const [{ data: quiz }, { data: questions }] = await Promise.all([
    locals.supabase.from('quizzes').select('id, title, subject').eq('id', result.quiz_id).maybeSingle(),
    locals.supabase.from('questions').select('id, content, options, multi, explanation').eq('quiz_id', result.quiz_id)
  ]);

  type StoredAnswer = { question_id: string; chosen?: string[]; correct?: string[]; is_correct?: boolean };
  const byId = new Map(((questions ?? []) as ReviewQuestion[]).map(q => [q.id, q]));
  const answers = (Array.isArray(result.answers) ? (result.answers as StoredAnswer[]) : []).map(a => ({
    question_id: a.question_id,
    chosen: Array.isArray(a.chosen) ? a.chosen : [],
    is_correct: !!a.is_correct,
    question: byId.get(a.question_id) ?? null
  }));

  return {
    result: { id: result.id, score: result.score, total: result.total, time_spent: result.time_spent, completed_at: result.completed_at },
    quiz: quiz as { id: string; title: string; subject: string | null } | null,
    quizId: result.quiz_id as string,
    answers
  };
};
