// src/routes/thong-bao/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export interface NotificationRow {
  id: string;
  type: 'follow' | 'like' | 'comment';
  created_at: string;
  read_at: string | null;
  quiz_id: string | null;
  actor: { username: string; display_name: string | null; avatar_url: string | null } | null;
  quiz: { title: string } | null;
  comment: { content: string } | null;
}

export const load: PageServerLoad = async ({ locals }) => {
  const { user } = await locals.safeGetSession();
  if (!user) throw redirect(303, '/auth?next=/thong-bao');

  const { data, error } = await locals.supabase
    .from('notifications')
    .select(`id, type, created_at, read_at, quiz_id,
      actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_url),
      quiz:quizzes(title),
      comment:quiz_comments(content)`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(60);
  if (error) console.error('notifications failed:', error.message);

  return { items: (data ?? []) as unknown as NotificationRow[], unavailable: !!error };
};
