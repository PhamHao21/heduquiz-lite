import { describe, expect, it } from 'vitest';
import { quizToText, safeFileName } from './exportText';
import { parseQuizText } from './parser';

describe('quizToText', () => {
  const questions = [
    { content: 'Thủ đô Việt Nam?', multi: false, explanation: 'Từ năm 1010.', options: [
      { text: 'Huế', is_correct: false }, { text: 'Hà Nội', is_correct: true } ] },
    { content: 'Cho các ý:\nI. a\nII. b\nChọn số nguyên tố', multi: true, options: [
      { text: '2', is_correct: true }, { text: '4', is_correct: false }, { text: '5', is_correct: true } ] },
    { content: 'Nhiều đáp án nhưng chỉ một đúng', multi: true, options: [
      { text: 'x', is_correct: true }, { text: 'y', is_correct: false } ] }
  ];

  it('xuất đúng cú pháp', () => {
    expect(quizToText(questions.slice(0, 1))).toBe('Thủ đô Việt Nam?\nA. Huế\n*B. Hà Nội\n> Từ năm 1010.');
  });

  it('nhập lại vào parser ra đúng đề như cũ', () => {
    const parsed = parseQuizText(quizToText(questions)).questions;
    expect(parsed).toHaveLength(3);
    parsed.forEach((p, i) => {
      expect(p.error).toBeUndefined();
      expect(p.content).toBe(questions[i].content);
      expect(p.multi).toBe(questions[i].multi);
      expect(p.options.map(o => [o.text, o.is_correct])).toEqual(questions[i].options.map(o => [o.text, o.is_correct]));
    });
    expect(parsed[0].explanation).toBe('Từ năm 1010.');
  });
});

describe('safeFileName', () => {
  it('bỏ ký tự không hợp lệ trong tên file', () => {
    expect(safeFileName('Đề: Sinh học / chương 1?', 'txt')).toBe('Đề Sinh học chương 1.txt');
    expect(safeFileName('   ', 'txt')).toBe('de-thi.txt');
  });
});
