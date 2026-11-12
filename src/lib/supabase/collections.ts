// src/lib/supabase/collections.ts
// Thao tác bộ sưu tập từ trình duyệt (RLS migration 009: chỉ sửa bộ sưu tập của mình,
// chỉ thêm đề mình xem được).
import { supabase } from './client';

export interface MyCollection { id: string; title: string; is_public: boolean; has: boolean; count: number }

function friendly(err: { code?: string; message: string }): Error {
  if (err.code === '42P01' || err.code === 'PGRST205') return new Error('Tính năng này cần cập nhật database (migration 009).');
  if (err.code === '23514') return new Error('Tên bộ sưu tập từ 1 đến 120 ký tự.');
  return new Error(err.message);
}

/** Các bộ sưu tập của tôi, đánh dấu cái nào đã có đề quizId. */
export async function myCollectionsFor(userId: string, quizId: string): Promise<MyCollection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('id, title, is_public, collection_items(quiz_id)')
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw friendly(error);
  type Row = { id: string; title: string; is_public: boolean; collection_items: { quiz_id: string }[] };
  return ((data ?? []) as Row[]).map(c => ({
    id: c.id, title: c.title, is_public: c.is_public,
    count: c.collection_items.length,
    has: c.collection_items.some(i => i.quiz_id === quizId)
  }));
}

export async function createCollection(userId: string, title: string, isPublic: boolean, description?: string): Promise<string> {
  const { data, error } = await supabase
    .from('collections')
    .insert({ owner_id: userId, title: title.trim(), is_public: isPublic, description: description?.trim() || null })
    .select('id')
    .single();
  if (error) throw friendly(error);
  return data.id as string;
}

export async function updateCollection(id: string, patch: { title?: string; description?: string | null; is_public?: boolean }) {
  const { error } = await supabase.from('collections').update(patch).eq('id', id);
  if (error) throw friendly(error);
}

export async function deleteCollection(id: string) {
  const { error } = await supabase.from('collections').delete().eq('id', id);
  if (error) throw friendly(error);
}

export async function setInCollection(collectionId: string, quizId: string, inside: boolean) {
  const res = inside
    ? await supabase.from('collection_items').insert({ collection_id: collectionId, quiz_id: quizId })
    : await supabase.from('collection_items').delete().eq('collection_id', collectionId).eq('quiz_id', quizId);
  if (res.error && res.error.code !== '23505') throw friendly(res.error);
}
