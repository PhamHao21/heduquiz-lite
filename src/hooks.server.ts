// src/hooks.server.ts
import { createServerClient } from '@supabase/ssr';
import { sequence } from '@sveltejs/kit/hooks';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';

const supabase: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll:  () => event.cookies.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            event.cookies.set(name, value, { ...options, path: '/' })
          )
      }
    }
  );

  event.locals.safeGetSession = async () => {
    // Dùng getUser() để verify với Supabase Auth server — không dùng getSession()
    const { data: { user }, error } = await event.locals.supabase.auth.getUser();
    if (error || !user) return { session: null, user: null };
    // Lấy session chỉ để trả về token (không dùng user từ getSession)
    const { data: { session } } = await event.locals.supabase.auth.getSession();
    return { session, user };
  };

  return resolve(event, {
    filterSerializedResponseHeaders: (name) =>
      name === 'content-range' || name === 'x-supabase-api-version'
  });
};

export const handle = sequence(supabase);