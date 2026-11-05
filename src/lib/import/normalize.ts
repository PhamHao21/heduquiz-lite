// src/lib/import/normalize.ts
// Chuyển nội dung đọc từ file Word/PDF/TXT (danh sách đoạn văn) thành văn bản đề
// theo cú pháp của HeduQuiz, để đưa vào ô soạn đề và parser như khi dán tay.
import { parseAnswerKey } from '$lib/utils/parser';

/** Một đoạn chữ liền nhau có cùng định dạng. emphasis = in đậm hoặc gạch chân. */
export interface Run { text: string; emphasis?: boolean }
export type Paragraph = Run[];

// "Câu 1:", "Câu 12.", "Question 3)", "Bài 2 -"
const QUESTION_PREFIX_RE = /^(?:câu|cau|question|bài|bai)\s*\d+\s*[:.)\-–]?\s*/i;
// "1. ..." / "12) ..." — chỉ coi là câu mới khi đang không ở giữa nội dung câu hỏi
const NUMBER_PREFIX_RE = /^\d{1,4}\s*[.)]\s+/;
// "A. ..." / "b) ..." / "*C. ..."
const OPTION_START_RE = /^(\*{0,2})\s*([A-Ha-h])\s*[.)]\s*/;
// Đáp án nằm chung một dòng: tìm các nhãn A. B. C. … đứng sau khoảng trắng
const INLINE_LABEL_RE = /(^|\s)(\*{0,2})([A-H])[.)](?=\s)/g;
const EXPLAIN_RE = /^(?:giải thích|giai thich|lời giải|loi giai|hướng dẫn giải|huong dan giai|gợi ý|goi y)\s*[:：]\s*/i;

/** Tỉ lệ ký tự (không tính khoảng trắng) được in đậm/gạch chân để coi cả đáp án là được nhấn mạnh. */
const EMPHASIS_THRESHOLD = 0.6;

interface Segment { text: string; emphasisRatio: number }

const clean = (s: string) => s.normalize('NFC').replace(/[\u00a0\u2007\u202f]/g, ' ').replace(/[\u200b-\u200d\ufeff]/g, '');

/** Tách một đoạn văn thành các phần: câu hỏi + từng đáp án nếu các đáp án nằm chung một dòng. */
function splitParagraph(runs: Paragraph): Segment[] {
  let text = '';
  const emph: boolean[] = [];
  for (const run of runs) {
    const t = clean(run.text);
    text += t;
    for (let i = 0; i < t.length; i++) emph.push(!!run.emphasis);
  }

  const ratio = (from: number, to: number) => {
    let total = 0, strong = 0;
    for (let i = from; i < to; i++) {
      if (/\s/.test(text[i])) continue;
      total++;
      if (emph[i]) strong++;
    }
    return total === 0 ? 0 : strong / total;
  };

  // Tìm chuỗi nhãn liên tiếp A, B, C… trong đoạn văn
  const labels: { index: number; letter: string }[] = [];
  for (const m of text.matchAll(INLINE_LABEL_RE)) {
    const index = (m.index ?? 0) + m[1].length;
    const letter = m[3];
    if (labels.length === 0) {
      if (letter === 'A') labels.push({ index, letter });
    } else if (letter.charCodeAt(0) === labels[labels.length - 1].letter.charCodeAt(0) + 1) {
      labels.push({ index, letter });
    }
  }

  const startsWithOption = OPTION_START_RE.test(text.trim());
  const cuts = labels.length >= 2 ? labels.map(l => l.index) : [];
  if (cuts.length === 0) return [{ text, emphasisRatio: ratio(0, text.length) }];

  const segments: Segment[] = [];
  if (cuts[0] > 0 && !startsWithOption) {
    segments.push({ text: text.slice(0, cuts[0]), emphasisRatio: ratio(0, cuts[0]) });
  } else if (cuts[0] > 0) {
    cuts[0] = 0;
  }
  cuts.forEach((from, i) => {
    const to = i + 1 < cuts.length ? cuts[i + 1] : text.length;
    segments.push({ text: text.slice(from, to), emphasisRatio: ratio(from, to) });
  });
  return segments;
}

export interface ImportResult {
  /** văn bản đề theo cú pháp HeduQuiz */
  text: string;
  /** số câu có đáp án đúng được nhận từ chữ in đậm/gạch chân */
  emphasisMarked: number;
}

/**
 * Chuyển các đoạn văn thành văn bản đề:
 * - "Câu 1:", "1." … mở đầu câu mới (bỏ phần đánh số), thêm dòng trắng giữa các câu
 * - đáp án "A)" / "a." được chuẩn hoá thành "A.", đáp án chung một dòng được tách ra
 * - đáp án in đậm/gạch chân (chỉ một vài đáp án trong câu) được đánh dấu * là đáp án đúng
 * - "Giải thích:/Lời giải:" chuyển thành dòng "> ", "Đáp án: B" được giữ nguyên cho parser
 */
export function paragraphsToQuizText(paragraphs: Paragraph[]): ImportResult {
  const out: string[] = [];
  type State = 'none' | 'content' | 'options' | 'after' | 'explain';
  let state: State = 'none';
  let options: { line: number; emphasised: boolean; starred: boolean }[] = [];
  let emphasisMarked = 0;

  const finishQuestion = () => {
    const hasStar = options.some(o => o.starred);
    const emphasised = options.filter(o => o.emphasised);
    // Chỉ dùng định dạng khi một phần (không phải tất cả) đáp án được nhấn mạnh.
    if (!hasStar && emphasised.length > 0 && emphasised.length < options.length) {
      for (const o of emphasised) out[o.line] = `*${out[o.line]}`;
      emphasisMarked++;
    }
    options = [];
  };

  const startQuestion = () => {
    finishQuestion();
    if (out.length > 0 && out[out.length - 1] !== '') out.push('');
  };

  for (const paragraph of paragraphs) {
    for (const seg of splitParagraph(paragraph)) {
      const t = seg.text.trim();
      if (!t) continue;

      const prefix = t.match(QUESTION_PREFIX_RE) ??
        (state !== 'content' && state !== 'explain' ? t.match(NUMBER_PREFIX_RE) : null);
      if (prefix) {
        startQuestion();
        const rest = t.slice(prefix[0].length).trim();
        if (rest) out.push(rest);
        state = 'content';
        continue;
      }

      const opt = t.match(OPTION_START_RE);
      if (opt && state !== 'none') {
        const rest = t.slice(opt[0].length).trim();
        out.push(`${opt[1]}${opt[2].toUpperCase()}. ${rest}`);
        options.push({ line: out.length - 1, emphasised: seg.emphasisRatio >= EMPHASIS_THRESHOLD, starred: opt[1].length > 0 });
        state = 'options';
        continue;
      }

      if (parseAnswerKey(t)) {
        out.push(t);
        state = 'after';
        continue;
      }

      const explain = t.match(EXPLAIN_RE);
      if (explain || t.startsWith('>')) {
        const rest = explain ? t.slice(explain[0].length).trim() : t.replace(/^>\s*/, '');
        out.push(`> ${rest}`);
        state = 'explain';
        continue;
      }

      if (state === 'options' || state === 'after') {
        // Dòng thường sau phần đáp án → câu hỏi mới (đề không đánh số câu).
        startQuestion();
        out.push(t);
        state = 'content';
      } else {
        out.push(t);
        if (state === 'none') state = 'content';
      }
    }
  }
  finishQuestion();

  return { text: out.join('\n').trim(), emphasisMarked };
}

/** Văn bản thuần (TXT, PDF) → đoạn văn không có định dạng. */
export function plainTextToParagraphs(text: string): Paragraph[] {
  return text.split(/\r?\n/).map(line => [{ text: line }]);
}
