// src/lib/utils/text.ts

/** Bỏ dấu tiếng Việt và viết thường để so khớp: "Thống Kê" → "thong ke". */
export function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

/** Mọi từ trong truy vấn đều xuất hiện trong chuỗi (không phân biệt dấu, thứ tự tuỳ ý). */
export function matchesQuery(text: string, query: string): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const hay = fold(text);
  return words.every(w => hay.includes(w));
}
