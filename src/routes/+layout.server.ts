// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export interface HeaderProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const load: LayoutServerLoad = async ({ locals }) => {
  const { session, user } = await locals.safeGetSession();
  let profile: HeaderProfile | null = null;
  if (user) {
    const { data } = await locals.supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    profile = data ?? {
      id: user.id,
      username: user.email?.split('@')[0] ?? 'ban',
      display_name: (user.user_metadata?.full_name as string | undefined) ?? null,
      avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null
    };
  }
  return { session, profile };
};
