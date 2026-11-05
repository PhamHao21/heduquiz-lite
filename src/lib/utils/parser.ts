// src/lib/utils/parser.ts

export interface ParsedOption {
  label: string;
  text: string;
  is_correct: boolean;
}

export interface ParsedQuestion {
  position: number;
  content: string;
  options: ParsedOption[];
  multi: boolean;
  /** giải thích đáp án (dòng bắt đầu bằng ">" hoặc "Giải thích:") */
  explanation?: string;
  error?: ParseErrorCode;
}

export interface ParsedSection {
  title: string;
  questions: ParsedQuestion[];
}

export interface ParseResult {
  sections: ParsedSection[];
  questions: ParsedQuestion[];
  errors: { position: number; code: ParseErrorCode }[];
  stats: { total: number; valid: number; errorCount: number };
}

export type ParseErrorCode =
  | 'empty_question'
  | 'no_answers'
  | 'insufficient_answers'
  | 'missing_correct_answer';

// Nhãn đáp án: một chữ cái A–H theo sau là dấu chấm ("A. ...", "b. ...").
// Giới hạn A–H để các dòng như "I. phát biểu..." trong đề không bị hiểu nhầm là đáp án.
const OPTION_LABEL_RE = /^([A-Ha-h])\.\s*/;

// Dòng giải thích: "> ..." hoặc "Giải thích: ..." (không phân biệt hoa thường, có/không dấu).
const EXPLANATION_RE = /^(?:>\s*|(?:giải thích|giai thich)\s*:\s*)/i;

function normaliseLine(raw: string): string {
  return raw.replace(/<br\s*\/>/gi, '\n').trim();
}

function parseOption(raw: string): { label: string; text: string } {
  const match = raw.match(OPTION_LABEL_RE);
  if (match) return { label: match[1].toUpperCase(), text: raw.slice(match[0].length).trim() };
  return { label: '', text: raw.trim() };
}

/** Nhãn hiển thị theo vị trí: 0 → A, 1 → B, ... */
export function optionLabel(index: number): string {
  return String.fromCharCode(65 + index);
}

function validateQuestion(q: ParsedQuestion): ParseErrorCode | undefined {
  if (!q.content.trim())                   return 'empty_question';
  if (q.options.length === 0)              return 'no_answers';
  if (q.options.length < 2)               return 'insufficient_answers';
  if (!q.options.some(o => o.is_correct)) return 'missing_correct_answer';
}

export function parseQuizText(raw: string): ParseResult {
  const sections: ParsedSection[] = [{ title: 'Phần 1', questions: [] }];
  const errors: ParseResult['errors'] = [];

  type Block = { lines: string[]; sectionTitle: string };
  const blocks: Block[] = [];
  let currentBlock: string[] = [];
  let activeSectionTitle = 'Phần 1';

  const sectionMap = new Map<string, ParsedSection>([['Phần 1', sections[0]]]);

  function flushBlock() {
    const trimmed = currentBlock.map(l => l.trim()).filter(Boolean);
    if (trimmed.length) blocks.push({ lines: trimmed, sectionTitle: activeSectionTitle });
    currentBlock = [];
  }

  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trim();
    if (line.startsWith("'")) {
      flushBlock();
      activeSectionTitle = line.slice(1).trim() || activeSectionTitle;
    } else if (line === '') {
      flushBlock();
    } else {
      currentBlock.push(rawLine);
    }
  }
  flushBlock();

  let position = 0;
  for (const block of blocks) {
    position++;

    let section = sectionMap.get(block.sectionTitle);
    if (!section) {
      section = { title: block.sectionTitle, questions: [] };
      sections.push(section);
      sectionMap.set(block.sectionTitle, section);
    }

    const question: ParsedQuestion = { position, content: '', options: [], multi: false };
    const contentLines: string[] = [];
    let parsingOptions = false;
    let markedMulti = false;
    // Đáp án trước đó có nhãn rõ ràng ("A.") hay không — dùng để quyết định
    // một dòng không nhãn là đáp án mới hay là phần tiếp theo của đáp án trước.
    let lastOptionLabelled = false;
    const explanationLines: string[] = [];
    let parsingExplanation = false;

    block.lines.forEach((rawLine, lineIndex) => {
      const line = normaliseLine(rawLine);
      const starred = line.startsWith('*');

      // Dòng đầu tiên của mỗi khối luôn là nội dung câu hỏi (trừ khi bắt đầu bằng *),
      // nên câu hỏi như "A. Einstein sinh năm nào?" không bị hiểu nhầm là đáp án.
      if (lineIndex === 0 && !starred) {
        contentLines.push(line);
        return;
      }

      // Giải thích: từ dòng "> ..." trở đi, các dòng thường được nối vào phần giải thích.
      if (EXPLANATION_RE.test(line)) {
        parsingExplanation = true;
        const text = line.replace(EXPLANATION_RE, '').trim();
        if (text) explanationLines.push(text);
        return;
      }
      if (parsingExplanation && !starred && !OPTION_LABEL_RE.test(line)) {
        explanationLines.push(line);
        return;
      }
      parsingExplanation = false;

      if (starred) {
        const isDouble = line.startsWith('**');
        if (isDouble) markedMulti = true;
        const { label, text } = parseOption(line.slice(isDouble ? 2 : 1).trim());
        question.options.push({ label, text, is_correct: true });
        parsingOptions = true;
        lastOptionLabelled = label !== '';
      } else if (OPTION_LABEL_RE.test(line)) {
        const { label, text } = parseOption(line);
        question.options.push({ label, text, is_correct: false });
        parsingOptions = true;
        lastOptionLabelled = true;
      } else if (parsingOptions && lastOptionLabelled) {
        // Đáp án viết trên nhiều dòng → nối vào đáp án trước.
        const prev = question.options[question.options.length - 1];
        prev.text = `${prev.text}\n${line}`.trim();
      } else if (parsingOptions) {
        // Kiểu đáp án không có nhãn ("*Hà Nội / Huế / Đà Nẵng").
        question.options.push({ label: '', text: line, is_correct: false });
      } else {
        contentLines.push(line);
      }
    });

    // Luôn đánh lại nhãn theo vị trí để mỗi đáp án có nhãn duy nhất
    // (tránh chọn một đáp án mà sáng cả các đáp án khác cùng nhãn rỗng/trùng).
    question.options = question.options.map((o, i) => ({ ...o, label: optionLabel(i) }));
    // Có từ 2 đáp án đúng trở lên thì là câu nhiều đáp án, kể cả khi người nhập dùng * thay vì **.
    question.multi = markedMulti || question.options.filter(o => o.is_correct).length > 1;

    question.content = contentLines.join('\n').trim();
    const explanation = explanationLines.join('\n').trim();
    if (explanation) question.explanation = explanation;
    const errorCode = validateQuestion(question);
    if (errorCode) { question.error = errorCode; errors.push({ position, code: errorCode }); }
    section.questions.push(question);
  }

  const questions = sections.flatMap(s => s.questions);
  return {
    sections, questions, errors,
    stats: { total: questions.length, valid: questions.filter(q => !q.error).length, errorCount: errors.length }
  };
}

/**
 * Chuyển câu hỏi đã parse thành các dòng để lưu DB: bỏ câu lỗi và đánh lại
 * position liên tục 1..n, để phạm vi "câu X → Y" của các phần thi khớp với position.
 */
export function toQuestionRows(questions: ParsedQuestion[]) {
  return questions
    .filter(q => !q.error)
    .map((q, i) => ({
      position: i + 1,
      content: q.content,
      options: q.options,
      multi: q.multi,
      explanation: q.explanation ?? null
    }));
}
