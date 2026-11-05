// src/routes/quiz/[id]/+page.server.ts
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { summariseReview, type ReviewSummary } from '$lib/utils/review';
import { followingIds, likeCounts, likedIds } from '$lib/server/social';
import type { CommentItem } from '$lib/supabase/social';

export const load: PageServerLoad = async ({ locals, params }) => {
  const { session } = await locals.safeGetSession();

  const { data: quiz, error: quizErr } = await locals.supabase
    .from('quizzes')
    // Thêm sections vào select
    .select('id, title, description, subject, is_public, owner_id, play_count, created_at, sections')
    .eq('id', params.id)
    .single();

  if (quizErr || !quiz) {
    // RLS ẩn đề riêng tư với người chưa đăng nhập → mời đăng nhập rồi quay lại đúng đề này.
    if (!session) throw redirect(303, `/auth?next=${encodeURIComponent(`/quiz/${params.id}`)}`);
    throw error(404, 'Không tìm thấy đề thi');
  }

  // Chỉ owner hoặc quiz public mới được xem (RLS đã chặn, kiểm tra thêm cho chắc)
  if (!quiz.is_public && quiz.owner_id !== session?.user.id) {
    throw error(404, 'Không tìm thấy đề thi');
  }

  const [{ data: questions }, { data: owner }] = await Promise.all([
    locals.supabase
      .from('questions')
      .select('id, position, content, options, multi, explanation')
      .eq('quiz_id', params.id)
      .order('position', { ascending: true }),
    locals.supabase
      .from('profiles')
      .select('username, display_name, avatar_url')
      .eq('id', quiz.owner_id)
      .maybeSingle()
  ]);

  // Lịch sử làm bài của user này (nếu đã login): 5 lượt gần nhất để hiển thị,
  // và tối đa 50 lượt để tính các câu cần ôn (trả lời sai ở lần gần nhất).
  let history: { id: string; score: number; total: number; time_spent: number | null; completed_at: string }[] = [];
  let review: ReviewSummary | null = null;
  if (session) {
    const { data } = await locals.supabase
      .from('results')
      .select('id, score, total, time_spent, completed_at, answers')
      .eq('quiz_id', params.id)
      .eq('user_id', session.user.id)
      .order('completed_at', { ascending: false })
      .limit(50);
    const attempts = data ?? [];
    history = attempts.slice(0, 5).map(h => ({
      id: h.id, score: h.score, total: h.total, time_spent: h.time_spent, completed_at: h.completed_at
    }));
    review = summariseReview(attempts, (questions ?? []).map(q => q.id));
  }

  // Mạng xã hội (migration 008): số tim, đã thả tim chưa, đang theo dõi tác giả chưa, bình luận.
  // Lỗi (chưa chạy migration) thì bỏ qua để trang đề vẫn hoạt động.
  const [likes, liked, followed, commentsRes] = await Promise.all([
    likeCounts(locals.supabase, [quiz.id]),
    likedIds(locals.supabase, session?.user.id, [quiz.id]),
    followingIds(locals.supabase, session?.user.id, [quiz.owner_id]),
    locals.supabase
      .from('quiz_comments')
      .select('id, content, created_at, user_id, author:profiles(username, display_name, avatar_url)')
      .eq('quiz_id', quiz.id)
      .order('created_at', { ascending: false })
      .limit(100)
  ]);

  return {
    social: {
      likeCount: likes[quiz.id] ?? 0,
      liked: liked.includes(quiz.id),
      followingOwner: followed.includes(quiz.owner_id),
      comments: (commentsRes.error ? [] : commentsRes.data ?? []) as unknown as CommentItem[],
      available: !commentsRes.error
    },
    quiz,
    questions: questions ?? [],
    history,
    review,
    owner: owner as { username: string; display_name: string | null; avatar_url: string | null } | null,
    isOwner: quiz.owner_id === session?.user.id
  };
};
