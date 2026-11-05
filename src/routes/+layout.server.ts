// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { unreadNotifications } from '$lib/server/social';

export interface HeaderProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const load: LayoutServerLoad = async ({ locals }) => {
  const { session, user } = await locals.safeGetSession();
  let profile: HeaderProfile | null = null;
  let unread = 0;
  if (user) {
    const [{ data }, count] = await Promise.all([
      locals.supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle(),
      unreadNotifications(locals.supabase, user.id)
    ]);
    profile = data ?? {
      id: user.id,
      username: user.email?.split('@')[0] ?? 'ban',
      display_name: (user.user_metadata?.full_name as string | undefined) ?? null,
      avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null
    };
    unread = count;
  }
  return { session, profile, unread };
};
