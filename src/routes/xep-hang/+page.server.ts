// src/routes/xep-hang/+page.server.ts
// Bảng xếp hạng (RPC leaderboard — migration 007). Xem được khi chưa đăng nhập.
import type { PageServerLoad } from './$types';

export interface LeaderRow {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  score: number;
  extra: number;
}

const KINDS   = { 'on-thi': 'learners', 'tao-de': 'creators' } as const;
const PERIODS = { tuan: 'week', thang: 'month', 'tat-ca': 'all' } as const;

export const load: PageServerLoad = async ({ locals, url }) => {
  const kindParam   = url.searchParams.get('loai') === 'tao-de' ? 'tao-de' : 'on-thi';
  const periodParam = (['tuan', 'thang', 'tat-ca'] as const).find(p => p === url.searchParams.get('ky')) ?? 'tuan';

  const [{ user }, { data, error }] = await Promise.all([
    locals.safeGetSession(),
    locals.supabase.rpc('leaderboard', {
      p_kind: KINDS[kindParam],
      p_period: PERIODS[periodParam],
      p_limit: 50
    })
  ]);
  if (error) console.error('leaderboard failed:', error.message);

  return {
    rows: (data ?? []) as LeaderRow[],
    kind: kindParam,
    period: periodParam,
    myId: user?.id ?? null,
    unavailable: !!error
  };
};
