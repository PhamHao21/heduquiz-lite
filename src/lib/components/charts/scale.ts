// src/lib/components/charts/scale.ts

/** Làm tròn giá trị lớn nhất lên một mốc "đẹp" (1, 2, 5 × 10ⁿ) để trục y dễ đọc. */
export function niceMax(v: number): number {
  if (!(v > 0)) return 5;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return m * p;
}

/** "YYYY-MM-DD" → "12/11" */
export const shortDate = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

/** Đường bo góc 4px ở đầu cột, vuông ở đáy (cột mọc từ đường đáy). */
export function columnPath(x: number, y: number, w: number, h: number, r = 4): string {
  const rr = Math.min(r, w / 2, h);
  const bottom = y + h;
  return `M${x},${bottom}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${bottom}Z`;
}
