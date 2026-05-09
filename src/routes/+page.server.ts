// src/routes/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession();
  // Đã login → vào kho đề ngay
  if (session) throw redirect(303, '/kho-de');
  return {};
};
