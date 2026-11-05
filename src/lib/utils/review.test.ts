import { describe, expect, it } from 'vitest';
import { summariseReview, type AttemptRecord } from './review';

const attempt = (day: number, answers: [string, boolean][]): AttemptRecord => ({
  completed_at: `2026-11-${String(day).padStart(2, '0')}T10:00:00Z`,
  answers: answers.map(([question_id, is_correct]) => ({ question_id, chosen: [], correct: [], is_correct }))
});

describe('summariseReview', () => {
  it('câu sai ở lần gần nhất là câu cần ôn', () => {
    const r = summariseReview([attempt(1, [['q1', true], ['q2', false], ['q3', false]])], ['q1', 'q2', 'q3']);
    expect(r.needsReview.map(s => s.question_id)).toEqual(['q2', 'q3']);
    expect(r.attemptsCounted).toBe(1);
  });

  it('ôn lại làm đúng thì câu rời khỏi danh sách, làm sai lại thì quay lại', () => {
    const r = summariseReview(
      // thứ tự truyền vào không theo thời gian: hàm phải tự sắp xếp
      [attempt(3, [['q2', true]]), attempt(1, [['q1', false], ['q2', false]]), attempt(2, [['q1', true], ['q2', false]]), attempt(4, [['q1', false]])],
      ['q1', 'q2']
    );
    expect(r.needsReview).toEqual([{ question_id: 'q1', wrong: 2, seen: 3, lastCorrect: false }]);
  });

  it('sai nhiều lần hơn thì lên đầu, bằng nhau thì theo thứ tự trong đề', () => {
    const r = summariseReview(
      [attempt(1, [['q1', false], ['q2', false], ['q3', false]]), attempt(2, [['q3', false]])],
      ['q1', 'q2', 'q3']
    );
    expect(r.needsReview.map(s => s.question_id)).toEqual(['q3', 'q1', 'q2']);
  });

  it('bỏ qua câu không còn trong đề và dữ liệu hỏng', () => {
    const r = summariseReview(
      [
        attempt(1, [['deleted', false], ['q1', false]]),
        { completed_at: '2026-11-02T00:00:00Z', answers: null },
        { completed_at: '2026-11-03T00:00:00Z', answers: [null, 'x', { question_id: 'q1' }, { question_id: 'q1', is_correct: 'no' }] }
      ],
      ['q1']
    );
    expect(r.needsReview.map(s => s.question_id)).toEqual(['q1']);
    expect(r.needsReview[0].seen).toBe(1);
  });

  it('một câu xuất hiện 2 lần trong cùng lượt chỉ tính 1 lần', () => {
    const r = summariseReview([attempt(1, [['q1', false], ['q1', true]])], ['q1']);
    expect(r.needsReview[0]).toMatchObject({ seen: 1, wrong: 1 });
  });

  it('chưa làm bài lần nào thì không có câu cần ôn', () => {
    expect(summariseReview([], ['q1'])).toEqual({ needsReview: [], attemptsCounted: 0 });
  });
});
