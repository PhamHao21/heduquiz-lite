// src/lib/server/search.ts
// Tìm kiếm toàn trang: đề công khai (explore_quizzes, migration 007/008), đề của tôi,
// người dùng và bộ sưu tập công khai (search_profiles / search_collections, migration 009).
// Mỗi nguồn lỗi riêng thì chỉ nguồn đó rỗng, các nguồn khác vẫn trả về.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SearchCollection, SearchPerson, SearchQuiz, SearchResults } from '$lib/utils/searchTypes';

function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, c => `\\${c}`);
}

export async function searchAll(
  sb: SupabaseClient,
  rawQuery: string,
  userId: string | undefined,
  limits: { quizzes: number; mine: number; people: number; collections: number; offset?: number }
): Promise<SearchResults> {
  const q = rawQuery.trim().slice(0, 100);
  if (!q) return { quizzes: [], quizTotal: 0, mine: [], people: [], collections: [] };

  const [pub, mine, people, cols] = await Promise.all([
    limits.quizzes > 0
      ? sb.rpc('explore_quizzes', { p_search: q, p_subject: null, p_sort: 'popular', p_limit: limits.quizzes, p_offset: limits.offset ?? 0 })
      : Promise.resolve({ data: [], error: null }),
    userId && limits.mine > 0
      ? sb.from('quizzes').select('id, title, subject, play_count, questions(count)')
          .eq('owner_id', userId).ilike('title', `%${escapeLike(q)}%`)
          .order('updated_at', { ascending: false }).limit(limits.mine)
      : Promise.resolve({ data: [], error: null }),
    limits.people > 0 ? sb.rpc('search_profiles', { p_query: q, p_limit: limits.people }) : Promise.resolve({ data: [], error: null }),
    limits.collections > 0 ? sb.rpc('search_collections', { p_query: q, p_limit: limits.collections }) : Promise.resolve({ data: [], error: null })
  ]);

  const quizzes = ((pub.error ? [] : pub.data) ?? []) as (SearchQuiz & { total_count?: number })[];
  type MineRow = { id: string; title: string; subject: string | null; play_count: number; questions?: { count: number }[] };
  return {
    quizzes,
    quizTotal: Number(quizzes[0]?.total_count ?? 0),
    mine: ((mine.error ? [] : mine.data) as MineRow[] ?? []).map(r => ({
      id: r.id, title: r.title, subject: r.subject, play_count: r.play_count,
      question_count: r.questions?.[0]?.count ?? null, owner_name: null, owner_avatar: null, owner_username: null
    })),
    people: ((people.error ? [] : people.data) ?? []) as SearchPerson[],
    collections: ((cols.error ? [] : cols.data) ?? []).map((c: SearchCollection) => ({ ...c, item_count: Number(c.item_count) }))
  };
}
