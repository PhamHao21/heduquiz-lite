import { describe, expect, it } from 'vitest';
import { formatDuration, studyStats, vnHour, type ResultRecord } from './stats';
import { computeAchievements } from './achievements';

const NOW = new Date('2026-11-12T03:00:00Z'); // 10:00 giờ VN
const r = (vnDate: string, score: number, total: number, quiz = 'q1', subject: string | null = 'THPT', hour = 9): ResultRecord => ({
  completed_at: new Date(`${vnDate}T${String(hour).padStart(2, '0')}:00:00+07:00`).toISOString(),
  score, total, time_spent: 60, quiz_id: quiz, quiz: { title: `Đề ${quiz}`, subject }
});

describe('studyStats', () => {
  const data = [
    r('2026-11-12', 8, 10), r('2026-11-12', 5, 5, 'q2', 'Đại học'),
    r('2026-11-10', 3, 10), r('2026-10-20', 9, 10),            // trong 30 ngày
    r('2026-10-05', 2, 4, 'q3', null),                           // kỳ trước (30-60 ngày)
    { ...r('2026-11-11', 1, 1), completed_at: 'hỏng' }           // bỏ qua
  ];
  const s = studyStats(data, 30, NOW);

  it('tổng số trong kỳ và kỳ trước', () => {
    expect(s.totals).toMatchObject({ attempts: 4, questions: 35, correct: 25, seconds: 240 });
    expect(s.totals.accuracy).toBeCloseTo(25 / 35);
    expect(s.previous).toMatchObject({ attempts: 1, questions: 4, correct: 2 });
  });

  it('chuỗi theo ngày: đủ 30 ngày, ngày không làm có độ chính xác null', () => {
    expect(s.series).toHaveLength(30);
    expect(s.series.at(-1)).toMatchObject({ date: '2026-11-12', questions: 15, correct: 13, attempts: 2 });
    expect(s.series.find(d => d.date === '2026-11-11')?.accuracy).toBeNull();
    expect(s.todayQuestions).toBe(15);
  });

  it('theo môn và đề làm nhiều', () => {
    expect(s.bySubject.map(x => x.subject)).toEqual(['THPT', 'Đại học']);
    expect(s.bySubject[1].accuracy).toBe(1);
    const q1 = s.topQuizzes[0];
    expect(q1).toMatchObject({ quiz_id: 'q1', attempts: 3, questions: 30 });
    expect(q1.best).toBeCloseTo(0.9);
    expect(q1.last).toBeCloseTo(0.8); // lượt mới nhất
    expect(q1.accuracy).toBeCloseTo(20 / 30);
  });

  it('không có dữ liệu', () => {
    const empty = studyStats([], 7, NOW);
    expect(empty.totals.accuracy).toBeNull();
    expect(empty.series.every(d => d.questions === 0)).toBe(true);
  });
});

describe('tiện ích', () => {
  it('giờ Việt Nam và thời lượng', () => {
    expect(vnHour('2026-11-11T22:30:00Z')).toBe(5);
    expect(formatDuration(20)).toBe('dưới 1 phút');
    expect(formatDuration(45 * 60)).toBe('45 phút');
    expect(formatDuration(3600)).toBe('1 giờ');
    expect(formatDuration(5100)).toBe('1 giờ 25 phút');
  });
});

describe('computeAchievements', () => {
  const base = { attempts: 0, questions: 0, perfectScores: 0, bestStreak: 0, subjects: 0, publicQuizzes: 0, likesReceived: 0, followers: 0, earlyBird: false, nightOwl: false };
  it('chưa có gì thì chưa mở khoá', () => {
    expect(computeAchievements(base).every(a => a.level === 0)).toBe(true);
  });
  it('tính bậc và tiến độ tới bậc tiếp theo', () => {
    const list = computeAchievements({ ...base, attempts: 3, questions: 300, bestStreak: 7, nightOwl: true });
    const q = list.find(a => a.id === 'questions')!;
    expect(q).toMatchObject({ level: 1, next: 500 });
    expect(q.progress).toBeCloseTo(0.5);
    expect(q.description).toContain('500');
    expect(list.find(a => a.id === 'streak')).toMatchObject({ level: 2, next: 30 });
    expect(list.find(a => a.id === 'first')).toMatchObject({ level: 1, next: null, progress: 1 });
    expect(list.find(a => a.id === 'night')?.level).toBe(1);
  });
});
