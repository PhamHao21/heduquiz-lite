// src/lib/supabase/social.ts
// Thao tác mạng xã hội từ trình duyệt. Quyền được kiểm soát bởi RLS (migration 008):
// chỉ thả tim / theo dõi / bình luận dưới tên chính mình, và chỉ với đề được phép xem.
import { supabase } from './client';

const DUPLICATE = '23505';

function friendly(err: { code?: string; message: string }): Error {
  if (err.code === '42P01' || err.code === 'PGRST205') {
    return new Error('Tính năng này cần cập nhật database (migration 008).');
  }
  return new Error(err.message);
}

export async function setLike(userId: string, quizId: string, like: boolean): Promise<void> {
  const res = like
    ? await supabase.from('quiz_likes').insert({ user_id: userId, quiz_id: quizId })
    : await supabase.from('quiz_likes').delete().eq('user_id', userId).eq('quiz_id', quizId);
  if (res.error && res.error.code !== DUPLICATE) throw friendly(res.error);
}

export async function setFollow(userId: string, targetId: string, follow: boolean): Promise<void> {
  const res = follow
    ? await supabase.from('follows').insert({ follower_id: userId, following_id: targetId })
    : await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', targetId);
  if (res.error && res.error.code !== DUPLICATE) throw friendly(res.error);
}

export interface CommentItem {
  id: string; content: string; created_at: string; user_id: string;
  author: { username: string; display_name: string | null; avatar_url: string | null } | null;
}

export interface CommentRow {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

export async function addComment(userId: string, quizId: string, content: string): Promise<CommentRow> {
  const { data, error } = await supabase
    .from('quiz_comments')
    .insert({ user_id: userId, quiz_id: quizId, content: content.trim() })
    .select('id, content, created_at, user_id')
    .single();
  if (error) throw friendly(error);
  return data as CommentRow;
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('quiz_comments').delete().eq('id', id);
  if (error) throw friendly(error);
}

export async function markNotificationsRead(userId: string): Promise<void> {
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', userId).is('read_at', null);
}
