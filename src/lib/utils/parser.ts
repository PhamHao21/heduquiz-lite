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

const OPTION_LABEL_RE = /^([A-Za-z])\.\s*/;

function normaliseLine(raw: string): string {
  return raw.replace(/<br\s*\/>/gi, '\n').trim();
}

function parseOption(raw: string): { label: string; text: string } {
  const match = raw.match(OPTION_LABEL_RE);
  if (match) return { label: match[1].toUpperCase(), text: raw.slice(match[0].length).trim() };
  return { label: '', text: raw.trim() };
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

    for (const rawLine of block.lines) {
      const line = normaliseLine(rawLine);
      if (line.startsWith('**')) {
        parsingOptions = true;
        question.multi = true;
        const { label, text } = parseOption(line.slice(2).trim());
        question.options.push({ label, text, is_correct: true });
      } else if (line.startsWith('*')) {
        parsingOptions = true;
        const { label, text } = parseOption(line.slice(1).trim());
        question.options.push({ label, text, is_correct: true });
      } else if (parsingOptions || OPTION_LABEL_RE.test(line)) {
        parsingOptions = true;
        const { label, text } = parseOption(line);
        question.options.push({ label, text, is_correct: false });
      } else {
        contentLines.push(line);
      }
    }

    question.content = contentLines.join('\n').trim();
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
