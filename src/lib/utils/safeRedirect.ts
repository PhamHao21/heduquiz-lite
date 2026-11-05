// src/lib/utils/safeRedirect.ts

/** Tên cookie lưu trang cần quay lại sau khi đăng nhập Google. */
export const NEXT_COOKIE = 'hedu_next';

/**
 * Chỉ chấp nhận đường dẫn nội bộ ("/kho-de", "/quiz/abc?x=1").
 * Chặn URL ngoài như "https://evil.com", "//evil.com", "/\\evil.com" (open redirect).
 */
export function safeNext(raw: string | null | undefined, fallback = '/'): string {
  if (!raw) return fallback;
  let value: string;
  try {
    value = decodeURIComponent(raw).trim();
  } catch {
    return fallback;
  }
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  // Ký tự điều khiển (xuống dòng, tab…) có thể bị trình duyệt bỏ qua → chặn luôn.
  if ([...value].some(c => c.charCodeAt(0) < 32)) return fallback;
  return value;
}
