// src/routes/bo-suu-tap/[id]/+page.server.ts
// Một bộ sưu tập: thông tin, chủ sở hữu, danh sách đề (chỉ các đề người xem được phép thấy).
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { likeCounts, likedIds } from '$lib/server/social';
import { missingTable } from '$lib/server/collections';

type ItemRow = {
  added_at: string;
  quiz: {
    id: string; title: string; subject: string | null; play_count: number; is_public: boolean; owner_id: string;
    questions: { count: number }[];
    owner: { username: string; display_name: string | null; avatar_url: string | null } | null;
  } | null;
};

export const load: PageServerLoad = async ({ locals, params }) => {
  const { user } = await locals.safeGetSession();
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) throw error(404, 'Không tìm thấy bộ sưu tập');

  const { data: c, error: err } = await locals.supabase
    .from('collections')
    .select('id, title, description, is_public, owner_id, created_at, updated_at, owner:profiles(username, display_name, avatar_url)')
    .eq('id', params.id)
    .maybeSingle();
  if (missingTable(err)) throw error(503, 'Bộ sưu tập cần cập nhật database (migration 009).');
  if (!c) throw error(404, 'Bộ sưu tập không tồn tại hoặc đang ở chế độ riêng tư');

  const { data: rows } = await locals.supabase
    .from('collection_items')
    .select('added_at, quiz:quizzes(id, title, subject, play_count, is_public, owner_id, questions(count), owner:profiles(username, display_name, avatar_url))')
    .eq('collection_id', c.id)
    .order('added_at', { ascending: false });

  // RLS trả về quiz = null với đề đã chuyển sang riêng tư (của người khác): bỏ qua, nhưng đếm để báo chủ sở hữu.
  const items = (rows ?? []) as unknown as ItemRow[];
  const visible = items.filter((r): r is ItemRow & { quiz: NonNullable<ItemRow['quiz']> } => !!r.quiz);
  const ids = visible.map(r => r.quiz.id);
  const [likes, liked] = await Promise.all([likeCounts(locals.supabase, ids), likedIds(locals.supabase, user?.id, ids)]);

  const quizzes = visible.map(r => ({
    id: r.quiz.id,
    title: r.quiz.title,
    subject: r.quiz.subject,
    play_count: r.quiz.play_count,
    is_public: r.quiz.is_public,
    like_count: likes[r.quiz.id] ?? 0,
    question_count: r.quiz.questions?.[0]?.count ?? 0,
    owner_name: r.quiz.owner?.display_name || r.quiz.owner?.username || null,
    owner_avatar: r.quiz.owner?.avatar_url ?? null,
    owner_username: r.quiz.owner?.username ?? null,
    added_at: r.added_at
  }));

  return {
    collection: c as unknown as {
      id: string; title: string; description: string | null; is_public: boolean; owner_id: string;
      created_at: string; updated_at: string;
      owner: { username: string; display_name: string | null; avatar_url: string | null } | null;
    },
    quizzes,
    hidden: items.length - visible.length,
    liked,
    isOwner: user?.id === c.owner_id,
    totalQuestions: quizzes.reduce((s, q) => s + q.question_count, 0)
  };
};
