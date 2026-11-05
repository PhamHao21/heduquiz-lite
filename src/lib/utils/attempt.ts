// src/lib/utils/attempt.ts
// Logic thuần (không phụ thuộc UI) cho một lượt làm bài: chuẩn hoá câu hỏi, sắp xếp/đảo,
// chấm điểm tạm ở client và lưu/khôi phục tiến trình trong localStorage.
import { shuffle } from './shuffle';

export interface Option   { label: string; text: string; is_correct: boolean }
export interface Question {
  id: string; position: number; content: string; options: Option[]; multi: boolean;
  /** giải thích đáp án (nếu người tạo đề có viết) */
  explanation?: string | null;
}
export interface Answer {
  question_id: string;
  /** nhãn gốc của đáp án (dùng để chấm điểm trên server) */
  chosen: string[];
  correct: string[];
  is_correct: boolean;
  /** đáp án hiển thị cho người làm, theo thứ tự trên màn hình: "B. Huế" */
  chosenText: string[];
  correctText: string[];
}

/** Chữ cái hiển thị theo vị trí trên màn hình: 0 → A, 1 → B… */
export const displayLetter = (index: number) => String.fromCharCode(65 + index);

/**
 * Chuẩn hoá đề đã lưu từ trước: đáp án thiếu nhãn/trùng nhãn được đánh lại A, B, C…
 * (chọn và chấm điểm dựa vào nhãn nên nhãn phải duy nhất), câu có ≥ 2 đáp án đúng là câu nhiều đáp án.
 */
export function normaliseQuestion(q: Question): Question {
  const labels = q.options.map(o => o.label);
  const labelsOk = labels.every(Boolean) && new Set(labels).size === labels.length;
  const options = labelsOk ? q.options : q.options.map((o, i) => ({ ...o, label: displayLetter(i) }));
  return { ...q, options, multi: q.multi || options.filter(o => o.is_correct).length > 1 };
}

export interface Arrangement {
  /** id câu hỏi theo thứ tự hiển thị */
  order: string[];
  /** id câu hỏi → nhãn gốc của các đáp án theo thứ tự hiển thị */
  optionOrder: Record<string, string[]>;
}

/** Thứ tự hiện tại của một danh sách câu hỏi đã sắp xếp (để lưu lại). */
export function arrangementOf(questions: Question[]): Arrangement {
  return {
    order: questions.map(q => q.id),
    optionOrder: Object.fromEntries(questions.map(q => [q.id, q.options.map(o => o.label)]))
  };
}

function sameSet(a: string[], b: string[]) {
  return a.length === b.length && new Set(a).size === a.length && a.every(x => b.includes(x));
}

/**
 * Chuẩn hoá + đảo câu hỏi/đáp án cho một lượt làm bài. Nếu có `saved` (tiếp tục bài đang làm)
 * và vẫn khớp với đề hiện tại thì giữ nguyên thứ tự cũ, để người làm thấy đúng như trước khi refresh.
 */
export function arrangeQuestions(
  questions: Question[],
  opts: { shuffleQuestions: boolean; shuffleOptions: boolean },
  saved?: Arrangement | null
): Question[] {
  const base = questions.map(normaliseQuestion);
  const byId = new Map(base.map(q => [q.id, q]));

  if (saved && sameSet(saved.order, [...byId.keys()])) {
    return saved.order.map(id => {
      const q = byId.get(id)!;
      const labels = saved.optionOrder[id];
      if (!labels || !sameSet(labels, q.options.map(o => o.label))) return q;
      const byLabel = new Map(q.options.map(o => [o.label, o]));
      return { ...q, options: labels.map(l => byLabel.get(l)!) };
    });
  }

  const qs = opts.shuffleQuestions ? shuffle([...base]) : base;
  return opts.shuffleOptions ? qs.map(q => ({ ...q, options: shuffle([...q.options]) })) : qs;
}

/** Câu trả lời có đúng không: phải chọn đủ và chỉ chọn các đáp án đúng. */
export function isAnswerCorrect(q: Question, picked: string[]): boolean {
  const correct = q.options.filter(o => o.is_correct).map(o => o.label);
  return correct.length === picked.length && correct.every(l => picked.includes(l));
}

/** Chấm điểm tạm ở client để hiện kết quả ngay (server chấm lại khi lưu). */
export function gradeAttempt(questions: Question[], chosen: Record<string, string[]>): Answer[] {
  return questions.map(q => {
    const picked = chosen[q.id] ?? [];
    const correct = q.options.filter(o => o.is_correct).map(o => o.label);
    const describe = (labels: string[]) =>
      q.options
        .map((o, i) => (labels.includes(o.label) ? `${displayLetter(i)}. ${o.text}` : null))
        .filter((x): x is string => x !== null);
    return {
      question_id: q.id,
      chosen: picked,
      correct,
      is_correct: isAnswerCorrect(q, picked),
      chosenText: describe(picked),
      correctText: describe(correct)
    };
  });
}

// ── Lưu tiến trình làm bài (localStorage) ─────────────────────────────────

export type AttemptMode = 'normal' | 'review';

export interface QuizProgress extends Arrangement {
  v: 1;
  quizId: string;
  /** 'review' = lượt ôn câu sai */
  mode?: AttemptMode;
  sectionId: string | null;
  /** chế độ Học: hiện đáp án ngay sau mỗi câu */
  study?: boolean;
  /** (chế độ Học) các câu đã hiện đáp án */
  revealed?: Record<string, boolean>;
  /** các câu người làm đánh dấu để xem lại trước khi nộp */
  flagged?: Record<string, boolean>;
  chosen: Record<string, string[]>;
  current: number;
  startedAt: number;
  /** mốc hết giờ (ms), null nếu không giới hạn thời gian */
  endsAt: number | null;
  savedAt: number;
}

const PROGRESS_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const progressKey = (quizId: string) => `hedu:progress:${quizId}`;

export function loadProgress(quizId: string): QuizProgress | null {
  try {
    const raw = localStorage.getItem(progressKey(quizId));
    if (!raw) return null;
    const p = JSON.parse(raw) as QuizProgress;
    const valid =
      p?.v === 1 && p.quizId === quizId && Array.isArray(p.order) && p.order.length > 0 &&
      typeof p.chosen === 'object' && typeof p.startedAt === 'number' &&
      Date.now() - (p.savedAt ?? 0) < PROGRESS_TTL_MS;
    if (!valid) {
      localStorage.removeItem(progressKey(quizId));
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export function saveProgress(p: QuizProgress) {
  try {
    localStorage.setItem(progressKey(p.quizId), JSON.stringify({ ...p, savedAt: Date.now() }));
  } catch {
    // localStorage bị chặn/đầy: bỏ qua, chỉ mất khả năng khôi phục khi refresh.
  }
}

export function clearProgress(quizId: string) {
  try {
    localStorage.removeItem(progressKey(quizId));
  } catch {
    // bỏ qua
  }
}

/** Số câu đã trả lời trong một bản lưu tiến trình. */
export const answeredCount = (p: Pick<QuizProgress, 'order' | 'chosen'>) =>
  p.order.filter(id => (p.chosen[id]?.length ?? 0) > 0).length;
