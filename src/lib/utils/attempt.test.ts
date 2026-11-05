import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  answeredCount, arrangeQuestions, arrangementOf, clearProgress, gradeAttempt,
  loadProgress, normaliseQuestion, saveProgress, type Question, type QuizProgress
} from './attempt';

const q = (id: string, options: [string, string, boolean][], multi = false): Question => ({
  id, position: 1, content: `Câu ${id}`, multi,
  options: options.map(([label, text, is_correct]) => ({ label, text, is_correct }))
});

describe('normaliseQuestion', () => {
  it('đánh lại nhãn khi nhãn rỗng hoặc trùng', () => {
    const n = normaliseQuestion(q('1', [['', 'Hà Nội', true], ['', 'Huế', false]]));
    expect(n.options.map(o => o.label)).toEqual(['A', 'B']);
    const d = normaliseQuestion(q('2', [['A', 'x', true], ['A', 'y', false]]));
    expect(d.options.map(o => o.label)).toEqual(['A', 'B']);
  });

  it('giữ nguyên nhãn hợp lệ, bật multi khi có ≥ 2 đáp án đúng', () => {
    const n = normaliseQuestion(q('1', [['A', '2', true], ['B', '4', true], ['C', '3', false]]));
    expect(n.options.map(o => o.label)).toEqual(['A', 'B', 'C']);
    expect(n.multi).toBe(true);
  });
});

describe('arrangeQuestions', () => {
  const qs = [
    q('1', [['A', 'a1', true], ['B', 'b1', false], ['C', 'c1', false]]),
    q('2', [['A', 'a2', false], ['B', 'b2', true]]),
    q('3', [['A', 'a3', true], ['B', 'b3', false]])
  ];

  it('không đảo thì giữ nguyên thứ tự', () => {
    const r = arrangeQuestions(qs, { shuffleQuestions: false, shuffleOptions: false });
    expect(r.map(x => x.id)).toEqual(['1', '2', '3']);
    expect(r[0].options.map(o => o.label)).toEqual(['A', 'B', 'C']);
  });

  it('khôi phục đúng thứ tự đã lưu (kể cả thứ tự đáp án)', () => {
    const saved = { order: ['3', '1', '2'], optionOrder: { '1': ['C', 'A', 'B'], '2': ['B', 'A'], '3': ['A', 'B'] } };
    const r = arrangeQuestions(qs, { shuffleQuestions: true, shuffleOptions: true }, saved);
    expect(arrangementOf(r)).toEqual(saved);
  });

  it('bỏ qua bản lưu nếu đề đã thay đổi', () => {
    const saved = { order: ['1', '2', '999'], optionOrder: {} };
    const r = arrangeQuestions(qs, { shuffleQuestions: false, shuffleOptions: false }, saved);
    expect(r.map(x => x.id)).toEqual(['1', '2', '3']);
  });
});

describe('gradeAttempt', () => {
  it('chấm đúng/sai và mô tả đáp án theo chữ cái hiển thị', () => {
    // Đáp án đã bị đảo: trên màn hình là [C, A, B]
    const shown = [q('1', [['C', 'c1', false], ['A', 'a1', true], ['B', 'b1', false]])];
    const [right] = gradeAttempt(shown, { '1': ['A'] });
    expect(right.is_correct).toBe(true);
    expect(right.correctText).toEqual(['B. a1']);
    const [wrong] = gradeAttempt(shown, { '1': ['C'] });
    expect(wrong.is_correct).toBe(false);
    expect(wrong.chosenText).toEqual(['A. c1']);
  });

  it('câu nhiều đáp án phải chọn đủ và đúng', () => {
    const multi = [q('1', [['A', '2', true], ['B', '4', true], ['C', '3', false]], true)];
    expect(gradeAttempt(multi, { '1': ['B', 'A'] })[0].is_correct).toBe(true);
    expect(gradeAttempt(multi, { '1': ['A'] })[0].is_correct).toBe(false);
    expect(gradeAttempt(multi, { '1': ['A', 'B', 'C'] })[0].is_correct).toBe(false);
    expect(gradeAttempt(multi, {})[0].is_correct).toBe(false);
  });
});

describe('lưu tiến trình', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k)
    });
  });

  const progress: QuizProgress = {
    v: 1, quizId: 'quiz-1', sectionId: null, order: ['1', '2'], optionOrder: {},
    chosen: { '1': ['A'] }, current: 1, startedAt: Date.now(), endsAt: null, savedAt: 0
  };

  it('lưu, đọc lại và xoá', () => {
    saveProgress(progress);
    const loaded = loadProgress('quiz-1');
    expect(loaded?.chosen).toEqual({ '1': ['A'] });
    expect(answeredCount(loaded!)).toBe(1);
    clearProgress('quiz-1');
    expect(loadProgress('quiz-1')).toBeNull();
  });

  it('bỏ qua dữ liệu hỏng hoặc quá cũ', () => {
    localStorage.setItem('hedu:progress:quiz-1', '{not json');
    expect(loadProgress('quiz-1')).toBeNull();
    localStorage.setItem('hedu:progress:quiz-1', JSON.stringify({ ...progress, savedAt: Date.now() - 8 * 86400000 }));
    expect(loadProgress('quiz-1')).toBeNull();
  });

  it('không lỗi khi localStorage bị chặn', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); }
    });
    expect(() => saveProgress(progress)).not.toThrow();
    expect(loadProgress('quiz-1')).toBeNull();
    expect(() => clearProgress('quiz-1')).not.toThrow();
  });
});
