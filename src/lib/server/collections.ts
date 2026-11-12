// src/lib/server/collections.ts
// Đọc bộ sưu tập phía server (RLS: công khai hoặc của chính mình). Nếu database chưa có
// bảng collections (chưa chạy migration 009) thì trả về available = false để trang tự ẩn phần này.
import type { SupabaseClient } from '@supabase/supabase-js';

export interface CollectionCardData {
  id: string; title: string; description: string | null; is_public: boolean; updated_at: string;
  count: number; quizIds: string[];
  owner: { username: string; display_name: string | null; avatar_url: string | null } | null;
}

type Row = {
  id: string; title: string; description: string | null; is_public: boolean; updated_at: string;
  owner: CollectionCardData['owner'];
  collection_items: { quiz_id: string; added_at: string }[];
};

export function missingTable(err: { code?: string } | null): boolean {
  return !!err && (err.code === '42P01' || err.code === 'PGRST205' || err.code === 'PGRST200');
}

export async function listCollections(
  sb: SupabaseClient,
  opts: { ownerId?: string; excludeOwnerId?: string; publicOnly?: boolean; limit?: number }
): Promise<{ available: boolean; items: CollectionCardData[] }> {
  let q = sb
    .from('collections')
    .select('id, title, description, is_public, updated_at, owner:profiles(username, display_name, avatar_url), collection_items(quiz_id, added_at)')
    .order('updated_at', { ascending: false })
    .limit(opts.limit ?? 60);
  if (opts.ownerId) q = q.eq('owner_id', opts.ownerId);
  if (opts.excludeOwnerId) q = q.neq('owner_id', opts.excludeOwnerId);
  if (opts.publicOnly) q = q.eq('is_public', true);
  const { data, error } = await q;
  if (error) return { available: !missingTable(error), items: [] };
  const items = ((data ?? []) as unknown as Row[]).map(c => {
    const sorted = [...c.collection_items].sort((a, b) => b.added_at.localeCompare(a.added_at));
    return {
      id: c.id, title: c.title, description: c.description, is_public: c.is_public, updated_at: c.updated_at,
      owner: c.owner, count: sorted.length, quizIds: sorted.slice(0, 4).map(i => i.quiz_id)
    };
  });
  return { available: true, items };
}
