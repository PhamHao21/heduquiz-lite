// src/lib/utils/review.ts
// Tổng hợp "câu cần ôn" từ lịch sử làm bài (bảng results) của một người với một đề.

export interface AttemptRecord {
  completed_at: string;
  /** results.answers: [{ question_id, chosen, correct, is_correct }] */
  answers: unknown;
}

export interface QuestionReviewStat {
  question_id: string;
  /** số lần trả lời sai */
  wrong: number;
  /** số lần đã gặp câu này */
  seen: number;
  /** lần gần nhất trả lời đúng không */
  lastCorrect: boolean;
}

export interface ReviewSummary {
  /** câu trả lời SAI ở lần gần nhất, sai nhiều nhất lên đầu */
  needsReview: QuestionReviewStat[];
  /** số lượt làm bài đã được tính */
  attemptsCounted: number;
}

/**
 * Một câu "cần ôn" khi lần gần nhất gặp nó bị trả lời sai. Ôn lại mà làm đúng thì câu đó
 * tự rời khỏi danh sách. Chỉ tính các câu còn trong đề (questionIds, theo thứ tự trong đề).
 */
export function summariseReview(attempts: AttemptRecord[], questionIds: string[]): ReviewSummary {
  const order = new Map(questionIds.map((id, i) => [id, i]));
  const stats = new Map<string, QuestionReviewStat>();

  const chronological = [...attempts].sort(
    (a, b) => Date.parse(a.completed_at) - Date.parse(b.completed_at)
  );

  let attemptsCounted = 0;
  for (const attempt of chronological) {
    if (!Array.isArray(attempt.answers)) continue;
    attemptsCounted++;
    const seenInAttempt = new Set<string>();
    for (const raw of attempt.answers) {
      const a = raw as { question_id?: unknown; is_correct?: unknown } | null;
      const id = a?.question_id;
      if (typeof id !== 'string' || !order.has(id) || typeof a?.is_correct !== 'boolean') continue;
      if (seenInAttempt.has(id)) continue;
      seenInAttempt.add(id);

      const s = stats.get(id) ?? { question_id: id, wrong: 0, seen: 0, lastCorrect: true };
      s.seen++;
      if (!a.is_correct) s.wrong++;
      s.lastCorrect = a.is_correct;
      stats.set(id, s);
    }
  }

  const needsReview = [...stats.values()]
    .filter(s => !s.lastCorrect)
    .sort((a, b) => b.wrong - a.wrong || order.get(a.question_id)! - order.get(b.question_id)!);

  return { needsReview, attemptsCounted };
}
