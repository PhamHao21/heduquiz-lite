// src/lib/utils/stats.ts
// Thống kê học tập từ lịch sử làm bài (bảng results) của một người, theo giờ Việt Nam.
import { dayKey, VN_OFFSET_MINUTES } from './activity';

export interface ResultRecord {
  completed_at: string;
  score: number;
  total: number;
  time_spent: number | null;
  quiz_id: string;
  quiz: { title: string; subject: string | null } | null;
}

export interface Totals {
  attempts: number;
  questions: number;
  correct: number;
  /** tỉ lệ đúng 0..1, null nếu chưa làm câu nào */
  accuracy: number | null;
  seconds: number;
}

export interface DayPoint {
  date: string;
  questions: number;
  correct: number;
  attempts: number;
  accuracy: number | null;
}

export interface SubjectStat { subject: string; questions: number; correct: number; accuracy: number }
export interface QuizStat {
  quiz_id: string; title: string; attempts: number; questions: number;
  accuracy: number; best: number; last: number; last_at: string;
}

export interface StudyStats {
  days: number;
  totals: Totals;
  /** cùng số ngày ngay trước kỳ đang xem, để so sánh tăng / giảm */
  previous: Totals;
  series: DayPoint[];
  bySubject: SubjectStat[];
  topQuizzes: QuizStat[];
  todayQuestions: number;
}

function totalsOf(rows: ResultRecord[]): Totals {
  const questions = rows.reduce((s, r) => s + r.total, 0);
  const correct = rows.reduce((s, r) => s + r.score, 0);
  return {
    attempts: rows.length,
    questions,
    correct,
    accuracy: questions > 0 ? correct / questions : null,
    seconds: rows.reduce((s, r) => s + (r.time_spent ?? 0), 0)
  };
}

export function studyStats(results: ResultRecord[], days = 30, now: Date = new Date()): StudyStats {
  const valid = results.filter(r => !Number.isNaN(Date.parse(r.completed_at)) && r.total > 0);
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) keys.push(dayKey(new Date(now.getTime() - i * 86_400_000)));
  const inPeriod = new Set(keys);
  const prevKeys = new Set<string>();
  for (let i = 2 * days - 1; i >= days; i--) prevKeys.add(dayKey(new Date(now.getTime() - i * 86_400_000)));

  const current = valid.filter(r => inPeriod.has(dayKey(new Date(r.completed_at))));
  const previous = valid.filter(r => prevKeys.has(dayKey(new Date(r.completed_at))));

  const byDay = new Map<string, DayPoint>(keys.map(k => [k, { date: k, questions: 0, correct: 0, attempts: 0, accuracy: null }]));
  for (const r of current) {
    const d = byDay.get(dayKey(new Date(r.completed_at)))!;
    d.questions += r.total;
    d.correct += r.score;
    d.attempts += 1;
  }
  const series = keys.map(k => {
    const d = byDay.get(k)!;
    return { ...d, accuracy: d.questions > 0 ? d.correct / d.questions : null };
  });

  const subjects = new Map<string, { questions: number; correct: number }>();
  for (const r of current) {
    const name = r.quiz?.subject?.trim() || 'Khác';
    const s = subjects.get(name) ?? { questions: 0, correct: 0 };
    s.questions += r.total;
    s.correct += r.score;
    subjects.set(name, s);
  }
  const bySubject = [...subjects.entries()]
    .map(([subject, s]) => ({ subject, ...s, accuracy: s.correct / s.questions }))
    .sort((a, b) => b.questions - a.questions);

  const quizzes = new Map<string, QuizStat>();
  // duyệt từ cũ đến mới để "last" là lượt gần nhất
  for (const r of [...current].sort((a, b) => Date.parse(a.completed_at) - Date.parse(b.completed_at))) {
    const pct = r.score / r.total;
    const q = quizzes.get(r.quiz_id) ?? {
      quiz_id: r.quiz_id, title: r.quiz?.title ?? 'Đề đã bị xoá', attempts: 0, questions: 0,
      accuracy: 0, best: 0, last: 0, last_at: r.completed_at
    };
    const correctSoFar = q.accuracy * q.questions + r.score;
    q.attempts += 1;
    q.questions += r.total;
    q.accuracy = correctSoFar / q.questions;
    q.best = Math.max(q.best, pct);
    q.last = pct;
    q.last_at = r.completed_at;
    quizzes.set(r.quiz_id, q);
  }
  const topQuizzes = [...quizzes.values()].sort((a, b) => b.attempts - a.attempts || b.questions - a.questions).slice(0, 8);

  const today = dayKey(now);
  return {
    days,
    totals: totalsOf(current),
    previous: totalsOf(previous),
    series,
    bySubject,
    topQuizzes,
    todayQuestions: valid.filter(r => dayKey(new Date(r.completed_at)) === today).reduce((s, r) => s + r.total, 0)
  };
}

/** Giờ trong ngày theo giờ Việt Nam (0..23). */
export function vnHour(iso: string): number {
  return new Date(Date.parse(iso) + VN_OFFSET_MINUTES * 60_000).getUTCHours();
}

/** "1 giờ 25 phút", "40 phút", "dưới 1 phút" */
export function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 1) return 'dưới 1 phút';
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${m} phút`;
  return rest === 0 ? `${h} giờ` : `${h} giờ ${rest} phút`;
}
