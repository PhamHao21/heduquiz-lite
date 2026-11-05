// src/lib/utils/exportText.ts
// Xuất đề về văn bản theo đúng cú pháp HeduQuiz (dán lại vào trang Tạo đề là ra đề như cũ).
import { optionLabel } from './parser';

export interface ExportQuestion {
  content: string;
  options: { text: string; is_correct: boolean }[];
  multi: boolean;
  explanation?: string | null;
}

export function quizToText(questions: ExportQuestion[]): string {
  return questions
    .map(q => {
      const mark = q.multi ? '**' : '*';
      const lines = [
        q.content.replace(/\n{2,}/g, '\n'),
        ...q.options.map((o, i) => `${o.is_correct ? mark : ''}${optionLabel(i)}. ${o.text.replace(/\n{2,}/g, '\n')}`)
      ];
      if (q.explanation?.trim()) lines.push(`> ${q.explanation.trim().replace(/\n{2,}/g, '\n')}`);
      return lines.join('\n');
    })
    .join('\n\n');
}

/** Tên file an toàn từ tên đề. */
export function safeFileName(title: string, ext: string): string {
  const printable = [...title.normalize('NFC')].filter(c => c.charCodeAt(0) >= 32).join('');
  const base = printable.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
  return `${base || 'de-thi'}.${ext}`;
}
