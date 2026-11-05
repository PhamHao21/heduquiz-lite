// src/lib/utils/cover.ts
// Ảnh bìa tự sinh cho đề / hồ sơ: mỗi id luôn ra cùng một bảng màu (ổn định giữa các lần tải),
// các đề khác nhau có màu khác nhau để danh sách không đơn điệu.

export interface CoverPalette { from: string; to: string }

/** Bảng màu dịu, đủ tương phản cho chữ trắng; không dùng tím "AI". */
export const COVER_PALETTES: CoverPalette[] = [
  { from: '#1f3fd1', to: '#5c7cff' }, // cobalt
  { from: '#0b6e66', to: '#2bb8a6' }, // teal
  { from: '#17713f', to: '#4caf73' }, // lá
  { from: '#b4471a', to: '#f08a4b' }, // cam đất
  { from: '#a5233f', to: '#e5677f' }, // hồng đậm
  { from: '#2c3a4f', to: '#6b7f99' }, // xám xanh
  { from: '#8a5a00', to: '#d9a12a' }, // hổ phách
  { from: '#0e5a8a', to: '#3aa0d8' }  // xanh biển
];

/** Băm chuỗi thành số không âm (FNV-1a 32-bit). */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function coverFor(key: string): CoverPalette {
  return COVER_PALETTES[hashString(key) % COVER_PALETTES.length];
}

/** CSS background cho ảnh bìa: gradient + lớp chấm mờ. */
export function coverStyle(key: string): string {
  const { from, to } = coverFor(key);
  const angle = 120 + (hashString(`${key}:a`) % 60);
  return `background-image: radial-gradient(rgb(255 255 255 / 0.16) 1px, transparent 1.2px), linear-gradient(${angle}deg, ${from}, ${to}); background-size: 14px 14px, 100% 100%;`;
}

/** 1-2 chữ cái đại diện cho tiêu đề ("Sinh học 12" → "SH"). */
export function initials(title: string): string {
  const words = title.normalize('NFC').split(/[\s:.,\-()]+/).filter(w => /\p{L}/u.test(w));
  const letters = words.slice(0, 2).map(w => w[0].toUpperCase());
  return letters.join('') || '?';
}
