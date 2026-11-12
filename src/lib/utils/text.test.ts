import { describe, expect, it } from 'vitest';
import { fold, matchesQuery } from './text';

describe('fold', () => {
  it('bỏ dấu và viết thường', () => {
    expect(fold('Thống Kê Học Tập')).toBe('thong ke hoc tap');
    expect(fold('Đề Địa lý')).toBe('de dia ly');
  });
});

describe('matchesQuery', () => {
  it('khớp không dấu, mọi từ, thứ tự tuỳ ý', () => {
    expect(matchesQuery('Lịch sử làm bài', 'lich su')).toBe(true);
    expect(matchesQuery('Lịch sử làm bài', 'bai lam')).toBe(true);
    expect(matchesQuery('Lịch sử làm bài', 'thong ke')).toBe(false);
    expect(matchesQuery('Bất kỳ', '   ')).toBe(true);
  });
});
