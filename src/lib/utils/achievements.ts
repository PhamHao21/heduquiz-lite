// src/lib/utils/achievements.ts
// Thành tích (huy hiệu) tính từ số liệu học tập. Mỗi thành tích có nhiều bậc: Đồng → Bạc → Vàng → Kim cương.

export interface AchievementInput {
  attempts: number;
  questions: number;
  perfectScores: number;
  bestStreak: number;
  subjects: number;
  publicQuizzes: number;
  likesReceived: number;
  followers: number;
  earlyBird: boolean;
  nightOwl: boolean;
}

export type AchievementIcon = 'rocket' | 'target' | 'flame' | 'star' | 'pen' | 'heart' | 'users' | 'compass' | 'sunrise' | 'moon';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: AchievementIcon;
  tiers: number[];
  value: number;
  /** số bậc đã đạt (0 = chưa mở khoá) */
  level: number;
  /** mốc của bậc tiếp theo, null nếu đã đạt bậc cao nhất */
  next: number | null;
  /** tiến độ tới bậc tiếp theo, 0..1 */
  progress: number;
}

export const TIER_NAMES = ['Đồng', 'Bạc', 'Vàng', 'Kim cương'];

interface Def { id: string; title: string; description: (next: number) => string; icon: AchievementIcon; tiers: number[]; value: (i: AchievementInput) => number }

const DEFS: Def[] = [
  { id: 'first', title: 'Khởi động', icon: 'rocket', tiers: [1], value: i => i.attempts,
    description: () => 'Hoàn thành bài ôn đầu tiên' },
  { id: 'questions', title: 'Chăm chỉ', icon: 'target', tiers: [100, 500, 2000, 10000], value: i => i.questions,
    description: n => `Làm tổng cộng ${n.toLocaleString('vi-VN')} câu hỏi` },
  { id: 'streak', title: 'Bền bỉ', icon: 'flame', tiers: [3, 7, 30, 100], value: i => i.bestStreak,
    description: n => `Ôn ${n} ngày liên tiếp` },
  { id: 'perfect', title: 'Điểm tuyệt đối', icon: 'star', tiers: [1, 5, 20, 50], value: i => i.perfectScores,
    description: n => `Đạt 100% ${n} lần (đề từ 5 câu)` },
  { id: 'explorer', title: 'Đa năng', icon: 'compass', tiers: [2, 3, 5], value: i => i.subjects,
    description: n => `Ôn đề của ${n} trình độ / môn khác nhau` },
  { id: 'author', title: 'Nhà soạn đề', icon: 'pen', tiers: [1, 5, 20, 50], value: i => i.publicQuizzes,
    description: n => `Chia sẻ ${n} đề công khai` },
  { id: 'loved', title: 'Được yêu thích', icon: 'heart', tiers: [10, 50, 200, 1000], value: i => i.likesReceived,
    description: n => `Nhận ${n.toLocaleString('vi-VN')} lượt tim` },
  { id: 'followers', title: 'Có sức ảnh hưởng', icon: 'users', tiers: [5, 25, 100, 500], value: i => i.followers,
    description: n => `Có ${n} người theo dõi` },
  { id: 'early', title: 'Chim sớm', icon: 'sunrise', tiers: [1], value: i => (i.earlyBird ? 1 : 0),
    description: () => 'Ôn bài lúc 5 đến 7 giờ sáng' },
  { id: 'night', title: 'Cú đêm', icon: 'moon', tiers: [1], value: i => (i.nightOwl ? 1 : 0),
    description: () => 'Ôn bài lúc 0 đến 4 giờ sáng' }
];

export function computeAchievements(input: AchievementInput): Achievement[] {
  return DEFS.map(d => {
    const value = d.value(input);
    const level = d.tiers.filter(t => value >= t).length;
    const next = level < d.tiers.length ? d.tiers[level] : null;
    const prevMark = level > 0 ? d.tiers[level - 1] : 0;
    const progress = next === null ? 1 : Math.max(0, Math.min(1, (value - prevMark) / (next - prevMark)));
    return {
      id: d.id,
      title: d.title,
      description: d.description(next ?? d.tiers[d.tiers.length - 1]),
      icon: d.icon,
      tiers: d.tiers,
      value,
      level,
      next,
      progress
    };
  });
}
