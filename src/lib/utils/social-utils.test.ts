import { describe, expect, it } from 'vitest';
import { COVER_PALETTES, coverFor, coverStyle, hashString, initials } from './cover';
import { compactNumber, timeAgo } from './time';

describe('cover', () => {
  it('cùng id luôn ra cùng màu, các id khác nhau dùng nhiều màu', () => {
    expect(coverFor('quiz-1')).toEqual(coverFor('quiz-1'));
    const used = new Set(Array.from({ length: 64 }, (_, i) => coverFor(`quiz-${i}`).from));
    expect(used.size).toBeGreaterThan(COVER_PALETTES.length / 2);
    expect(hashString('abc')).toBe(hashString('abc'));
    expect(coverStyle('x')).toContain('linear-gradient');
  });

  it('chữ viết tắt tiêu đề', () => {
    expect(initials('Sinh học 12: Di truyền')).toBe('SH');
    expect(initials('Toán')).toBe('T');
    expect(initials('12345')).toBe('?');
    expect(initials('đề ôn tập')).toBe('ĐÔ');
  });
});

describe('timeAgo', () => {
  const now = Date.parse('2026-11-05T10:00:00Z');
  it('các mốc thời gian', () => {
    expect(timeAgo('2026-11-05T09:59:40Z', now)).toBe('vừa xong');
    expect(timeAgo('2026-11-05T09:55:00Z', now)).toBe('5 phút trước');
    expect(timeAgo('2026-11-05T07:00:00Z', now)).toBe('3 giờ trước');
    expect(timeAgo('2026-11-02T10:00:00Z', now)).toBe('3 ngày trước');
    expect(timeAgo('2026-10-22T10:00:00Z', now)).toBe('2 tuần trước');
    expect(timeAgo('2026-09-01T10:00:00Z', now)).toBe('1/9/2026');
    expect(timeAgo('khong-phai-ngay', now)).toBe('');
  });
});

describe('compactNumber', () => {
  it('rút gọn số lớn', () => {
    expect(compactNumber(950)).toBe('950');
    expect(compactNumber(1000)).toBe('1K');
    expect(compactNumber(1250)).toBe('1,3K');
    expect(compactNumber(15300)).toBe('15K');
    expect(compactNumber(2_400_000)).toBe('2,4M');
  });
});
