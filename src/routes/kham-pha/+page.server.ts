// src/routes/kham-pha/+page.server.ts
// Trang Khám phá: đề công khai của mọi người (không cần đăng nhập). RPC explore_quizzes — migration 007.
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 24;
const SUBJECTS = ['THPT', 'THCS', 'Đại học', 'Cao đẳng', 'Tiểu học'] as const;

export interface ExploreQuiz {
  id: string;
  title: string;
  subject: string | null;
  description: string | null;
  play_count: number;
  question_count: number;
  created_at: string;
  owner_id: string;
  owner_name: string;
  owner_avatar: string | null;
  owner_username: string;
  total_count: number;
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const q       = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
  const subject = (url.searchParams.get('mon') ?? '').trim().slice(0, 50);
  const sort    = url.searchParams.get('sort') === 'new' ? 'new' : 'popular';
  const page    = Math.max(1, Math.min(500, Math.floor(Number(url.searchParams.get('trang')) || 1)));

  const { data, error } = await locals.supabase.rpc('explore_quizzes', {
    p_search: q || null,
    p_subject: subject || null,
    p_sort: sort,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE
  });
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
    unavailable: !!error
  };
};
