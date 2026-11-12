// src/routes/u/[username]/+page.server.ts
// Trang cá nhân công khai: hồ sơ, đề công khai, người theo dõi / đang theo dõi.
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { followingIds, likeCounts, likedIds } from '$lib/server/social';
import { listCollections } from '$lib/server/collections';

export type ProfileTab = 'de' | 'bo-suu-tap' | 'nguoi-theo-doi' | 'dang-theo-doi';

export interface PersonRow {
  id: string; username: string; display_name: string | null; avatar_url: string | null;
  bio: string | null; follower_count?: number;
}

export const load: PageServerLoad = async ({ locals, params, url }) => {
  const { user } = await locals.safeGetSession();
  const tabParam = url.searchParams.get('tab');
  const tab: ProfileTab = tabParam === 'nguoi-theo-doi' || tabParam === 'dang-theo-doi' || tabParam === 'bo-suu-tap' ? tabParam : 'de';

  // select('*') để vẫn chạy khi database chưa có cột follower_count (migration 008)
  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .maybeSingle();
  if (!profile) throw error(404, 'Không tìm thấy người dùng này');

  const { data: rows } = await locals.supabase
    .from('quizzes')
    .select('id, title, subject, play_count, created_at, questions(count)')
    .eq('owner_id', profile.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(100);

  const ids = (rows ?? []).map(r => r.id as string);
  const isMe = user?.id === profile.id;
  const [likes, liked, followingMe, collections] = await Promise.all([
    likeCounts(locals.supabase, ids),
    likedIds(locals.supabase, user?.id, ids),
    followingIds(locals.supabase, user?.id, [profile.id]),
    // Người khác chỉ thấy bộ sưu tập công khai; chủ trang thấy cả bộ riêng tư của mình.
    listCollections(locals.supabase, { ownerId: profile.id, publicOnly: !isMe, limit: 60 })
  ]);

  const quizzes = (rows ?? []).map(r => {
    const counted = (r as { questions?: { count: number }[] }).questions;
    return {
      id: r.id as string,
      title: r.title as string,
      subject: r.subject as string | null,
      play_count: r.play_count as number,
      created_at: r.created_at as string,
      like_count: likes[r.id as string] ?? 0,
      question_count: Array.isArray(counted) ? (counted[0]?.count ?? 0) : null
    };
  });

  // Danh sách người theo dõi / đang theo dõi (chỉ tải khi mở tab đó)
  let people: PersonRow[] = [];
  if (tab === 'nguoi-theo-doi' || tab === 'dang-theo-doi') {
    const isFollowers = tab === 'nguoi-theo-doi';
    const { data } = await locals.supabase
      .from('follows')
      .select(isFollowers
        ? 'created_at, person:profiles!follows_follower_id_fkey(*)'
        : 'created_at, person:profiles!follows_following_id_fkey(*)')
      .eq(isFollowers ? 'following_id' : 'follower_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(100);
    people = ((data ?? []) as unknown as { person: PersonRow | null }[]).map(r => r.person).filter((p): p is PersonRow => !!p);
  }
  const peopleFollowed = await followingIds(locals.supabase, user?.id, people.map(p => p.id));

  return {
    // Đặt tên "person" (không phải "profile") để không đè lên page.data.profile = người đang đăng nhập
    person: profile as PersonRow & { created_at: string; follower_count?: number; following_count?: number },
    quizzes,
    liked,
    tab,
    people,
    peopleFollowed,
    isFollowing: followingMe.includes(profile.id),
    totalPlays: quizzes.reduce((sum, q) => sum + (q.play_count ?? 0), 0),
    totalLikes: quizzes.reduce((sum, q) => sum + q.like_count, 0),
    collections: collections.items,
    collectionsAvailable: collections.available,
    isMe
  };
};
