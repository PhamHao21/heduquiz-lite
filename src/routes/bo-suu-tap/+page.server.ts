// src/routes/bo-suu-tap/+page.server.ts
// Bộ sưu tập của tôi + bộ sưu tập công khai mới cập nhật của mọi người.
import type { PageServerLoad } from './$types';
import { listCollections } from '$lib/server/collections';

export const load: PageServerLoad = async ({ locals }) => {
  const { user } = await locals.safeGetSession();
  const [mine, community] = await Promise.all([
    user ? listCollections(locals.supabase, { ownerId: user.id }) : Promise.resolve({ available: true, items: [] }),
    listCollections(locals.supabase, { publicOnly: true, excludeOwnerId: user?.id, limit: 12 })
  ]);
  // Chỉ hiện bộ sưu tập cộng đồng có ít nhất một đề
  return {
    available: mine.available && community.available,
    signedIn: !!user,
    mine: mine.items,
    community: community.items.filter(c => c.count > 0)
  };
};
