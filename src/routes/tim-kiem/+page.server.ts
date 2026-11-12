// src/routes/tim-kiem/+page.server.ts
import type { PageServerLoad } from './$types';
import { searchAll } from '$lib/server/search';
import { followingIds, likedIds } from '$lib/server/social';

export type SearchTab = 'tat-ca' | 'de' | 'nguoi-dung' | 'bo-suu-tap';
const PAGE = 24;

export const load: PageServerLoad = async ({ locals, url }) => {
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
  const t = url.searchParams.get('loai');
  const tab: SearchTab = t === 'de' || t === 'nguoi-dung' || t === 'bo-suu-tap' ? t : 'tat-ca';
  const page = Math.max(1, Math.min(200, Math.floor(Number(url.searchParams.get('trang')) || 1)));
  const { user } = await locals.safeGetSession();

  const all = tab === 'tat-ca';
  const results = await searchAll(locals.supabase, q, user?.id, {
    quizzes: all ? 9 : tab === 'de' ? PAGE : 0,
    offset: tab === 'de' ? (page - 1) * PAGE : 0,
    mine: all || tab === 'de' ? 6 : 0,
    people: all ? 6 : tab === 'nguoi-dung' ? 40 : 0,
    collections: all ? 4 : tab === 'bo-suu-tap' ? 40 : 0
  });
  const [liked, followed] = await Promise.all([
    likedIds(locals.supabase, user?.id, [...results.quizzes, ...results.mine].map(x => x.id)),
    followingIds(locals.supabase, user?.id, results.people.map(p => p.id))
  ]);
  return { q, tab, page, pageSize: PAGE, ...results, liked, followed, meId: user?.id ?? null };
};
