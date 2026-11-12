// src/routes/thiet-lap/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { user } = await locals.safeGetSession();
  if (!user) throw redirect(303, '/auth?next=/thiet-lap');

  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const me = (profile ?? {}) as { username?: string; display_name?: string | null; bio?: string | null; avatar_url?: string | null; daily_goal?: number };
  return {
    email: user.email ?? '',
    me: {
      username: me.username ?? '',
      display_name: me.display_name ?? '',
      bio: me.bio ?? '',
      avatar_url: me.avatar_url ?? null,
      daily_goal: me.daily_goal ?? 20,
      hasGoalColumn: me.daily_goal !== undefined
    }
  };
};
