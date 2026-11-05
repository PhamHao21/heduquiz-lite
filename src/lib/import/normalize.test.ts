import { describe, expect, it } from 'vitest';
import { paragraphsToQuizText, plainTextToParagraphs, type Paragraph } from './normalize';
import { parseQuizText } from '$lib/utils/parser';

const p = (...runs: (string | [string, true])[]): Paragraph =>
  runs.map(r => (typeof r === 'string' ? { text: r } : { text: r[0], emphasis: true }));
const fromText = (t: string) => paragraphsToQuizText(plainTextToParagraphs(t)).text;

describe('paragraphsToQuizText', () => {
  it('bỏ "Câu N:" và thêm dòng trắng giữa các câu', () => {
    const text = fromText('Câu 1: Thủ đô VN?\nA. Hà Nội\nB. Huế\nCâu 2. 1+1=?\nA) 2\nb) 3');
    expect(text).toBe('Thủ đô VN?\nA. Hà Nội\nB. Huế\n\n1+1=?\nA. 2\nB. 3');
  });

  it('nhận câu đánh số "1." và câu không đánh số sau phần đáp án', () => {
    const text = fromText('1. Câu một?\nA. x\nB. y\nCâu hai không đánh số?\nA. x\nB. y');
    expect(parseQuizText(text).questions.map(q => q.content)).toEqual(['Câu một?', 'Câu hai không đánh số?']);
  });

  it('không cắt nội dung câu hỏi có dòng bắt đầu bằng số', () => {
    const text = fromText('Câu 1: Cho các ý sau:\n1. Ý một\n2. Ý hai\nSố ý đúng?\nA. 1\nB. 2');
    const q = parseQuizText(text).questions;
    expect(q).toHaveLength(1);
    expect(q[0].content).toContain('1. Ý một');
  });

  it('tách đáp án nằm chung một dòng', () => {
    const text = fromText('Câu 1: 2 + 2 = ?\nA. 3    B. 4    C. 5    D. 6');
    expect(text).toBe('2 + 2 = ?\nA. 3\nB. 4\nC. 5\nD. 6');
  });

  it('tách cả khi câu hỏi và đáp án cùng một dòng', () => {
    const text = fromText('Câu 3: Màu của lá? A. Xanh B. Đỏ');
    expect(text).toBe('Màu của lá?\nA. Xanh\nB. Đỏ');
  });

  it('đáp án in đậm / gạch chân được đánh dấu là đáp án đúng', () => {
    const r = paragraphsToQuizText([
      p(['Câu 1: ', true], 'Thủ đô VN?'),
      p('A. Huế'),
      p(['B. Hà Nội', true]),
      p('C. Đà Nẵng')
    ]);
    expect(r.text).toBe('Thủ đô VN?\nA. Huế\n*B. Hà Nội\nC. Đà Nẵng');
    expect(r.emphasisMarked).toBe(1);
  });

  it('nhận đáp án in đậm trong dòng có nhiều đáp án', () => {
    const r = paragraphsToQuizText([p('Câu 1: Số chẵn?'), p('A. 1   ', ['B. 2', true], '   C. 3   ', ['D. 4', true])]);
    const q = parseQuizText(r.text).questions[0];
    expect(q.options.filter(o => o.is_correct).map(o => o.text)).toEqual(['2', '4']);
    expect(q.multi).toBe(true);
  });

  it('cả câu đều in đậm thì không đoán đáp án', () => {
    const r = paragraphsToQuizText([p(['Câu 1: Q?', true]), p(['A. x', true]), p(['B. y', true])]);
    expect(r.text).toBe('Q?\nA. x\nB. y');
    expect(r.emphasisMarked).toBe(0);
  });

  it('giữ dấu * có sẵn, không đánh dấu thêm theo định dạng', () => {
    const r = paragraphsToQuizText([p('Q?'), p(['A. x', true]), p('*B. y')]);
    expect(r.text).toBe('Q?\nA. x\n*B. y');
  });

  it('giữ dòng "Đáp án:" và chuyển "Giải thích:/Lời giải:" thành "> "', () => {
    const text = fromText('Câu 1: Q?\nA. x\nB. y\nĐáp án: B\nLời giải: vì y\nCâu 2: R?\nA. 1\nB. 2\nĐáp án: A');
    const qs = parseQuizText(text).questions;
    expect(qs.map(q => q.options.find(o => o.is_correct)?.text)).toEqual(['y', '1']);
    expect(qs[0].explanation).toBe('vì y');
  });

  it('chuẩn hoá tiếng Việt dạng tổ hợp (NFD) và khoảng trắng đặc biệt', () => {
    const nfd = 'Câu 1: Thủ đô?'.normalize('NFD');
    const text = fromText(`${nfd}\nA.\u00a0Hà Nội\nB. Huế`);
    expect(text).toBe('Thủ đô?\nA. Hà Nội\nB. Huế');
  });

  it('kết quả cuối cùng parse được đầy đủ', () => {
    const doc = [
      'ĐỀ ÔN TẬP CHƯƠNG 1',
      'Câu 1: Thủ đô của Việt Nam là',
      'A. Huế  B. Hà Nội  C. Đà Nẵng  D. Cần Thơ',
      'Đáp án: B',
      'Câu 2: Chọn các số nguyên tố',
      'A. 2', 'B. 4', 'C. 5', 'D. 9',
      'Đáp án: A, C'
    ].join('\n');
    const r = parseQuizText(fromText(doc));
    expect(r.stats.valid).toBe(2);
    // dòng tiêu đề đầu tài liệu thành một khối riêng (báo lỗi "không có đáp án"), không dính vào câu 1
    expect(r.questions[0]).toMatchObject({ content: 'ĐỀ ÔN TẬP CHƯƠNG 1', error: 'no_answers' });
    expect(r.questions[1].content).toBe('Thủ đô của Việt Nam là');
    expect(r.questions[1].options.find(o => o.is_correct)?.text).toBe('Hà Nội');
    expect(r.questions[2].multi).toBe(true);
  });
});
