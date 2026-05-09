// src/routes/tao-de/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const { session } = await locals.safeGetSession();
  if (!session) throw redirect(303, `/auth?next=${url.pathname}`);

  const editId = url.searchParams.get('edit');
  if (editId) {
    const { data: quiz } = await locals.supabase
      .from('quizzes')
      .select('id, title, subject, raw_text, is_public, sections')
      .eq('id', editId)
      .eq('owner_id', session.user.id) 
      .single();
    return { session, editQuiz: quiz ?? null };
  }

  return { session, editQuiz: null };
};
