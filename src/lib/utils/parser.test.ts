import { describe, expect, it } from 'vitest';
import { parseQuizText, toQuestionRows } from './parser';

const labelsOf = (txt: string, i = 0) =>
  parseQuizText(txt).questions[i].options.map(o => `${o.is_correct ? '*' : ''}${o.label}:${o.text}`);

describe('parseQuizText — cơ bản', () => {
  it('nhận câu một đáp án chuẩn', () => {
    const r = parseQuizText('Thủ đô Việt Nam?\n*A. Hà Nội\nB. Huế\nC. Đà Nẵng\nD. TP.HCM');
    expect(r.stats).toEqual({ total: 1, valid: 1, errorCount: 0 });
    const q = r.questions[0];
    expect(q.content).toBe('Thủ đô Việt Nam?');
    expect(q.multi).toBe(false);
    expect(labelsOf('Thủ đô Việt Nam?\n*A. Hà Nội\nB. Huế')).toEqual(['*A:Hà Nội', 'B:Huế']);
  });

  it('tách câu bằng dòng trắng', () => {
    const r = parseQuizText('Q1?\n*A. a\nB. b\n\n\nQ2?\nA. a\n*B. b');
    expect(r.questions.map(q => q.content)).toEqual(['Q1?', 'Q2?']);
  });

  it('câu hỏi nhiều dòng', () => {
    const r = parseQuizText('Cho đoạn văn:\n"Lorem ipsum"\nÝ chính là gì?\n*A. x\nB. y');
    expect(r.questions[0].content).toBe('Cho đoạn văn:\n"Lorem ipsum"\nÝ chính là gì?');
  });

  it('<br /> trong câu hỏi thành xuống dòng', () => {
    const r = parseQuizText('Dòng 1<br />Dòng 2\n*A. x\nB. y');
    expect(r.questions[0].content).toBe('Dòng 1\nDòng 2');
  });

  it('chia phần bằng dấu nháy đơn', () => {
    const r = parseQuizText("'Chương 1\nQ1?\n*A. a\nB. b\n\n'Chương 2\nQ2?\n*A. a\nB. b");
    expect(r.sections.filter(s => s.questions.length).map(s => s.title)).toEqual(['Chương 1', 'Chương 2']);
  });
});

describe('parseQuizText — báo lỗi', () => {
  it('thiếu đáp án đúng', () => {
    expect(parseQuizText('Q?\nA. a\nB. b').questions[0].error).toBe('missing_correct_answer');
  });
  it('chỉ có 1 đáp án', () => {
    expect(parseQuizText('Q?\n*A. a').questions[0].error).toBe('insufficient_answers');
  });
  it('không có đáp án', () => {
    expect(parseQuizText('Chỉ có câu hỏi?').questions[0].error).toBe('no_answers');
  });
  it('khối bắt đầu bằng đáp án thì thiếu nội dung câu hỏi', () => {
    expect(parseQuizText('*A. a\nB. b').questions[0].error).toBe('empty_question');
  });
});

describe('parseQuizText — các lỗi đã sửa ở giai đoạn 0', () => {
  it('đáp án không có nhãn được đánh nhãn A, B, C… duy nhất', () => {
    expect(labelsOf('Thủ đô VN?\n*Hà Nội\nHuế\nĐà Nẵng')).toEqual(['*A:Hà Nội', 'B:Huế', 'C:Đà Nẵng']);
  });

  it('nhãn bị trùng hoặc nhảy chữ được đánh lại theo vị trí', () => {
    expect(labelsOf('Q?\n*A. x\nA. y\nC. z')).toEqual(['*A:x', 'B:y', 'C:z']);
  });

  it('đáp án viết trên nhiều dòng được nối vào đáp án trước', () => {
    expect(labelsOf('Q?\n*A. dòng 1\ndòng 2 của A\nB. b')).toEqual(['*A:dòng 1\ndòng 2 của A', 'B:b']);
  });

  it('câu hỏi bắt đầu bằng "A." vẫn là nội dung câu hỏi', () => {
    const q = parseQuizText('A. Einstein sinh năm nào?\n*A. 1879\nB. 1900').questions[0];
    expect(q.error).toBeUndefined();
    expect(q.content).toBe('A. Einstein sinh năm nào?');
    expect(q.options).toHaveLength(2);
  });

  it('dòng "I." trong nội dung không bị hiểu là đáp án', () => {
    const q = parseQuizText('Cho các phát biểu:\nI. Đúng\nII. Sai\nSố phát biểu đúng?\n*A. 1\nB. 2').questions[0];
    expect(q.content).toBe('Cho các phát biểu:\nI. Đúng\nII. Sai\nSố phát biểu đúng?');
    expect(q.options).toHaveLength(2);
  });

  it('dùng ** thì là câu nhiều đáp án', () => {
    expect(parseQuizText('Q?\n**A. a\n**B. b\nC. c').questions[0].multi).toBe(true);
  });

  it('có 2 dấu * (không dùng **) vẫn là câu nhiều đáp án', () => {
    expect(parseQuizText('Số chẵn?\n*A. 2\n*B. 4\nC. 3').questions[0].multi).toBe(true);
  });

  it('một đáp án ** duy nhất vẫn là câu nhiều đáp án', () => {
    expect(parseQuizText('Q?\n**A. a\nB. b').questions[0].multi).toBe(true);
  });
});

describe('toQuestionRows', () => {
  it('bỏ câu lỗi và đánh lại position liên tục 1..n', () => {
    const r = parseQuizText('Q1?\n*A. a\nB. b\n\nQ2 hỏng?\nA. x\n\nQ3?\n*A. a\nB. b');
    expect(r.questions.map(q => q.position)).toEqual([1, 2, 3]);
    const rows = toQuestionRows(r.questions);
    expect(rows.map(q => [q.position, q.content])).toEqual([
      [1, 'Q1?'],
      [2, 'Q3?']
    ]);
    expect(rows[0]).not.toHaveProperty('error');
  });
});
