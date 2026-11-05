// src/routes/bang-tin/+page.server.ts
// Bảng tin: đề công khai mới của những người mình theo dõi (RPC following_feed, migration 008).
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { likedIds, suggestedAuthors } from '$lib/server/social';

export interface FeedItem {
  id: string; title: string; subject: string | null; play_count: number; like_count: number;
  question_count: number; created_at: string; owner_id: string; owner_name: string;
  owner_avatar: string | null; owner_username: string;
}

export const load: PageServerLoad = async ({ locals }) => {
  const { user } = await locals.safeGetSession();
  if (!user) throw redirect(303, '/auth?next=/bang-tin');

  const [{ data, error }, suggested] = await Promise.all([
    locals.supabase.rpc('following_feed', { p_limit: 30, p_offset: 0 }),
    suggestedAuthors(locals.supabase, 6)
  ]);
  if (error) console.error('following_feed failed:', error.message);
  const feed = (data ?? []) as FeedItem[];

  return {
    feed,
    suggested,
    liked: await likedIds(locals.supabase, user.id, feed.map(f => f.id)),
    unavailable: !!error
  };
};
