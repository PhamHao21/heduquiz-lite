import { describe, expect, it } from 'vitest';
import { safeNext } from './safeRedirect';

describe('safeNext', () => {
  it('giữ đường dẫn nội bộ', () => {
    expect(safeNext('/kho-de')).toBe('/kho-de');
    expect(safeNext('/tao-de?edit=abc')).toBe('/tao-de?edit=abc');
    expect(safeNext(encodeURIComponent('/tao-de?edit=abc'))).toBe('/tao-de?edit=abc');
  });

  it('chặn URL ra ngoài trang', () => {
    for (const bad of ['https://evil.com', '//evil.com', '/\\evil.com', 'evil.com', 'javascript:alert(1)', '%2F%2Fevil.com', '/\nhttps://evil.com', '%E0%A4%A']) {
      expect(safeNext(bad, '/fallback')).toBe('/fallback');
    }
  });

  it('dùng fallback khi rỗng', () => {
    expect(safeNext(null)).toBe('/');
    expect(safeNext('', '/x')).toBe('/x');
  });
});
