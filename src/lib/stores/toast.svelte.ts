// src/lib/stores/toast.svelte.ts
// Thông báo ngắn (toast) cho các thao tác thoáng qua: đã copy link, đã lưu, lỗi mạng…
export type ToastKind = 'success' | 'error' | 'info';
export interface Toast { id: number; kind: ToastKind; text: string }

let toasts = $state<Toast[]>([]);
let nextId = 1;

function push(kind: ToastKind, text: string, ms = 3200) {
  const id = nextId++;
  toasts = [...toasts, { id, kind, text }];
  setTimeout(() => dismiss(id), ms);
}

function dismiss(id: number) {
  toasts = toasts.filter(t => t.id !== id);
}

export const toast = {
  get items() { return toasts; },
  success: (text: string) => push('success', text),
  error: (text: string) => push('error', text, 5000),
  info: (text: string) => push('info', text),
  dismiss
};
