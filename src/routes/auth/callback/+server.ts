// src/routes/auth/callback/+server.ts
import { redirect } from '@sveltejs/kit';
import { NEXT_COOKIE, safeNext } from '$lib/utils/safeRedirect';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals, cookies }) => {
  const code = url.searchParams.get('code');
  // Trang cần quay lại: ưu tiên ?next=, sau đó cookie do trang /auth đặt trước khi sang Google.
  // Luôn kiểm tra để chỉ chuyển hướng trong nội bộ trang (chống open redirect).
  const next = safeNext(url.searchParams.get('next') ?? cookies.get(NEXT_COOKIE), '/');
  cookies.delete(NEXT_COOKIE, { path: '/' });

  if (code) {
    const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
    if (!error) throw redirect(303, next);
  }

  throw redirect(303, '/auth?error=callback_failed');
};
