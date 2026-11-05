// src/routes/u/[username]/+page.server.ts
// Trang cá nhân công khai: thông tin người dùng + các đề công khai của họ.
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  const { user } = await locals.safeGetSession();

  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, created_at')
    .eq('username', params.username)
    .maybeSingle();

  if (!profile) throw error(404, 'Không tìm thấy người dùng này');

  const { data: rows } = await locals.supabase
    .from('quizzes')
    .select('id, title, subject, play_count, created_at, questions(count)')
    .eq('owner_id', profile.id)
    .eq('is_public', true)
    .order('play_count', { ascending: false })
    .limit(100);

  const quizzes = (rows ?? []).map(r => {
    const counted = (r as { questions?: { count: number }[] }).questions;
    return {
      id: r.id as string,
      title: r.title as string,
      subject: r.subject as string | null,
      play_count: r.play_count as number,
      created_at: r.created_at as string,
      question_count: Array.isArray(counted) ? (counted[0]?.count ?? 0) : null
    };
  });

  return {
    profile,
    quizzes,
    totalPlays: quizzes.reduce((sum, q) => sum + (q.play_count ?? 0), 0),
    isMe: user?.id === profile.id
  };
};
