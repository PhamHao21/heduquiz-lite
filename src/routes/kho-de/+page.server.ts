// src/routes/kho-de/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { summariseActivity } from '$lib/utils/activity';
import { likeCounts } from '$lib/server/social';

export interface LikedQuiz {
  id: string; title: string; subject: string | null; play_count: number; like_count: number;
  owner_name: string | null; owner_avatar: string | null; owner_username: string | null;
}

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

  const since = new Date(Date.now() - 120 * 86_400_000).toISOString();

  const [{ data: quizzes }, { count: totalAttempts }, progressRes, { data: recent }, likedRes] = await Promise.all([
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
    locals.supabase.rpc('my_quiz_progress'),
    // Mốc thời gian làm bài trong ~4 tháng gần nhất để vẽ lịch hoạt động và tính chuỗi ngày ôn.
    locals.supabase
      .from('results')
      .select('completed_at')
      .eq('user_id', session.user.id)
      .gte('completed_at', since)
      .order('completed_at', { ascending: false })
      .limit(3000),
    // Đề đã thả tim (migration 008). Đề người khác chuyển sang riêng tư sẽ bị RLS ẩn (quiz = null).
    locals.supabase
      .from('quiz_likes')
      .select('created_at, quiz:quizzes(id, title, subject, play_count, like_count, owner:profiles(username, display_name, avatar_url))')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(60)
  ]);

  type LikedRow = { quiz: { id: string; title: string; subject: string | null; play_count: number; like_count: number;
    owner: { username: string; display_name: string | null; avatar_url: string | null } | null } | null };
  const liked: LikedQuiz[] = likedRes.error ? [] : ((likedRes.data ?? []) as unknown as LikedRow[])
    .filter(r => r.quiz)
    .map(({ quiz: q }) => ({
      id: q!.id, title: q!.title, subject: q!.subject, play_count: q!.play_count, like_count: q!.like_count,
      owner_name: q!.owner?.display_name ?? q!.owner?.username ?? null,
      owner_avatar: q!.owner?.avatar_url ?? null,
      owner_username: q!.owner?.username ?? null
    }));
  const myLikeCounts = await likeCounts(locals.supabase, (quizzes ?? []).map(q => q.id as string));

  if (progressRes.error) console.error('my_quiz_progress failed:', progressRes.error.message);
  const progress = (progressRes.data ?? []) as QuizProgressRow[];
  const activity = summariseActivity((recent ?? []).map(r => r.completed_at as string));

  return {
    quizzes: quizzes ?? [],
    progress,
    activity,
    liked,
    myLikeCounts,
    stats: {
      totalQuizzes:  quizzes?.length ?? 0,
      totalAttempts: totalAttempts ?? 0,
      needsReview:   progress.reduce((sum, p) => sum + Number(p.needs_review), 0)
    }
  };
};
