// src/lib/utils/time.ts

/** "vừa xong", "5 phút trước", "3 ngày trước"… quá 4 tuần thì hiện ngày. */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 45) return 'vừa xong';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} phút trước`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} ngày trước`;
  if (d < 28) return `${Math.round(d / 7)} tuần trước`;
  return new Date(t).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

/** Số gọn: 950 → "950", 1200 → "1,2K", 15300 → "15K". */
export function compactNumber(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace('.', ',').replace(',0', '')}K`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}K`;
  return `${(n / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '')}M`;
}
