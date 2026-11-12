// src/routes/kham-pha/+page.server.ts
// Trang Khám phá: đề công khai của mọi người (không cần đăng nhập). RPC explore_quizzes — migration 007.
import type { PageServerLoad } from './$types';
import { likedIds, suggestedAuthors } from '$lib/server/social';
import { listCollections } from '$lib/server/collections';

const PAGE_SIZE = 24;
const SUBJECTS = ['THPT', 'THCS', 'Đại học', 'Cao đẳng', 'Tiểu học'] as const;

export interface ExploreQuiz {
  id: string;
  title: string;
  subject: string | null;
  description: string | null;
  play_count: number;
  like_count?: number;
  question_count: number;
  created_at: string;
  owner_id: string;
  owner_name: string;
  owner_avatar: string | null;
  owner_username: string;
  total_count: number;
}

export interface TrendingQuiz {
  id: string; title: string; subject: string | null; play_count: number; like_count: number;
  question_count: number; recent_plays: number; owner_name: string; owner_avatar: string | null; owner_username: string;
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const q       = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
  const subject = (url.searchParams.get('mon') ?? '').trim().slice(0, 50);
  const sortParam = url.searchParams.get('sort');
  const sort    = sortParam === 'new' || sortParam === 'liked' ? sortParam : 'popular';
  const page    = Math.max(1, Math.min(500, Math.floor(Number(url.searchParams.get('trang')) || 1)));

  const { user } = await locals.safeGetSession();
  const showAuthors = !q && !subject && page === 1;
  const [{ data, error }, authors, trendingRes, collections] = await Promise.all([locals.supabase.rpc('explore_quizzes', {
    p_search: q || null,
    p_subject: subject || null,
    p_sort: sort,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE
  }), showAuthors ? suggestedAuthors(locals.supabase, 4) : Promise.resolve([]),
  // Đề hot 7 ngày + bộ sưu tập công khai (migration 009); lỗi thì chỉ ẩn mục đó
  showAuthors ? locals.supabase.rpc('trending_quizzes', { p_days: 7, p_limit: 6 }) : Promise.resolve({ data: [], error: null }),
  showAuthors ? listCollections(locals.supabase, { publicOnly: true, limit: 12 }) : Promise.resolve({ available: true, items: [] })]);
  if (error) console.error('explore_quizzes failed:', error.message);

  const quizzes = (data ?? []) as ExploreQuiz[];
  return {
    quizzes,
    total: quizzes[0]?.total_count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    q,
    subject,
    sort,
    subjects: [...SUBJECTS],
    liked: await likedIds(locals.supabase, user?.id, quizzes.map(x => x.id)),
    authors,
    trending: ((trendingRes.error ? [] : trendingRes.data) ?? []).map((t: TrendingQuiz) => ({ ...t, question_count: Number(t.question_count), recent_plays: Number(t.recent_plays) })) as TrendingQuiz[],
    collections: collections.items.filter(c => c.count > 0).slice(0, 4),
    unavailable: !!error
  };
};
