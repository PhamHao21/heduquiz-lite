// src/lib/utils/activity.ts
// Thống kê hoạt động học: số lượt làm bài theo ngày (giờ Việt Nam), chuỗi ngày ôn liên tiếp.

/** Giờ Việt Nam (UTC+7), không có giờ mùa hè. */
export const VN_OFFSET_MINUTES = 7 * 60;

export interface ActivityDay { date: string; count: number }
export interface ActivitySummary {
  /** các ngày từ cũ đến mới, ngày cuối là hôm nay */
  days: ActivityDay[];
  /** chuỗi ngày ôn liên tiếp tính đến hôm nay (hoặc hôm qua nếu hôm nay chưa ôn) */
  streak: number;
  /** chuỗi dài nhất trong khoảng thời gian */
  bestStreak: number;
  /** số ngày có ôn trong khoảng thời gian */
  activeDays: number;
  /** số lượt làm bài hôm nay */
  today: number;
}

/** "YYYY-MM-DD" theo giờ Việt Nam. */
export function dayKey(date: Date, offsetMinutes = VN_OFFSET_MINUTES): string {
  return new Date(date.getTime() + offsetMinutes * 60_000).toISOString().slice(0, 10);
}

export function summariseActivity(
  timestamps: string[],
  now: Date = new Date(),
  totalDays = 112,
  offsetMinutes = VN_OFFSET_MINUTES
): ActivitySummary {
  const counts = new Map<string, number>();
  for (const t of timestamps) {
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) continue;
    const key = dayKey(d, offsetMinutes);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const days: ActivityDay[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const key = dayKey(new Date(now.getTime() - i * 86_400_000), offsetMinutes);
    days.push({ date: key, count: counts.get(key) ?? 0 });
  }

  let bestStreak = 0;
  let run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    bestStreak = Math.max(bestStreak, run);
  }

  // Chuỗi hiện tại: đếm lùi từ hôm nay; nếu hôm nay chưa ôn thì bắt đầu từ hôm qua (chuỗi vẫn còn).
  let streak = 0;
  let i = days.length - 1;
  if (days[i]?.count === 0) i--;
  for (; i >= 0 && days[i].count > 0; i--) streak++;

  return {
    days,
    streak,
    bestStreak,
    activeDays: days.filter(d => d.count > 0).length,
    today: days[days.length - 1]?.count ?? 0
  };
}
