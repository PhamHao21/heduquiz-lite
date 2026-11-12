// src/routes/thong-ke/+page.server.ts
// Thống kê học tập + thành tích của người đang đăng nhập.
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { studyStats, vnHour, type ResultRecord } from '$lib/utils/stats';
import { summariseActivity } from '$lib/utils/activity';
import { computeAchievements } from '$lib/utils/achievements';
import { likeCounts } from '$lib/server/social';

const PERIODS = [7, 30, 90] as const;

export const load: PageServerLoad = async ({ locals, url }) => {
  const { user } = await locals.safeGetSession();
  if (!user) throw redirect(303, '/auth?next=/thong-ke');

  const days = PERIODS.find(p => String(p) === url.searchParams.get('ky')) ?? 30;

  const [{ data: rows }, { data: profile }, { data: myPublic }] = await Promise.all([
    locals.supabase
      .from('results')
      .select('completed_at, score, total, time_spent, quiz_id, quiz:quizzes(title, subject)')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(5000),
    // select('*') để vẫn chạy khi chưa có cột daily_goal / follower_count (migration 008, 009)
    locals.supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    locals.supabase.from('quizzes').select('id').eq('owner_id', user.id).eq('is_public', true)
  ]);

  const results = (rows ?? []) as unknown as ResultRecord[];
  const stats = studyStats(results, days);
  const activity = summariseActivity(results.map(r => r.completed_at), new Date(), 365);
  const likes = await likeCounts(locals.supabase, (myPublic ?? []).map(q => q.id as string));
  const hours = results.map(r => vnHour(r.completed_at));

  const achievements = computeAchievements({
    attempts: results.length,
    questions: results.reduce((s, r) => s + r.total, 0),
    perfectScores: results.filter(r => r.total >= 5 && r.score === r.total).length,
    bestStreak: activity.bestStreak,
    subjects: new Set(results.map(r => r.quiz?.subject).filter(Boolean)).size,
    publicQuizzes: myPublic?.length ?? 0,
    likesReceived: Object.values(likes).reduce((s, n) => s + n, 0),
    followers: Number((profile as { follower_count?: number } | null)?.follower_count ?? 0),
    earlyBird: hours.some(h => h >= 5 && h < 7),
    nightOwl: hours.some(h => h >= 0 && h < 4)
  });

  return {
    days,
    periods: [...PERIODS],
    stats,
    streak: activity.streak,
    bestStreak: activity.bestStreak,
    goal: Number((profile as { daily_goal?: number } | null)?.daily_goal ?? 20),
    achievements,
    hasAny: results.length > 0
  };
};
