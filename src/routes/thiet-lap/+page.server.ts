// src/routes/thiet-lap/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { user } = await locals.safeGetSession();
  if (!user) throw redirect(303, '/auth?next=/thiet-lap');

  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('username, display_name, bio, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  return {
    email: user.email ?? '',
    me: profile ?? { username: '', display_name: '', bio: '', avatar_url: null }
  };
};
