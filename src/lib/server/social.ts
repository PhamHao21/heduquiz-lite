// src/lib/server/social.ts
// Truy vấn mạng xã hội phía server. Mọi hàm đều "chịu lỗi": nếu database chưa chạy
// migration 008 (chưa có bảng/cột), trả về giá trị rỗng để trang chính vẫn hoạt động.
import type { SupabaseClient } from '@supabase/supabase-js';

/** id các đề trong danh sách mà người dùng đã thả tim */
export async function likedIds(sb: SupabaseClient, userId: string | undefined, quizIds: string[]): Promise<string[]> {
  if (!userId || quizIds.length === 0) return [];
  const { data, error } = await sb.from('quiz_likes').select('quiz_id').eq('user_id', userId).in('quiz_id', quizIds);
  return error ? [] : (data ?? []).map(r => r.quiz_id as string);
}

/** id những người trong danh sách mà người dùng đang theo dõi */
export async function followingIds(sb: SupabaseClient, userId: string | undefined, targetIds: string[]): Promise<string[]> {
  if (!userId || targetIds.length === 0) return [];
  const { data, error } = await sb.from('follows').select('following_id').eq('follower_id', userId).in('following_id', targetIds);
  return error ? [] : (data ?? []).map(r => r.following_id as string);
}

/** số tim của các đề (map id → số tim) */
export async function likeCounts(sb: SupabaseClient, quizIds: string[]): Promise<Record<string, number>> {
  if (quizIds.length === 0) return {};
  const { data, error } = await sb.from('quizzes').select('id, like_count').in('id', quizIds);
  if (error) return {};
  return Object.fromEntries((data ?? []).map(r => [r.id as string, Number(r.like_count ?? 0)]));
}

export async function unreadNotifications(sb: SupabaseClient, userId: string): Promise<number> {
  const { count, error } = await sb
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);
  return error ? 0 : (count ?? 0);
}

export interface SuggestedAuthor {
  id: string; username: string; display_name: string; avatar_url: string | null; bio: string | null;
  follower_count: number; public_quizzes: number; total_likes: number;
}

export async function suggestedAuthors(sb: SupabaseClient, limit = 6): Promise<SuggestedAuthor[]> {
  const { data, error } = await sb.rpc('suggested_authors', { p_limit: limit });
  return error ? [] : ((data ?? []) as SuggestedAuthor[]);
}
