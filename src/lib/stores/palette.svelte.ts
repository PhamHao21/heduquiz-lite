// src/lib/stores/palette.svelte.ts
// Trạng thái mở / đóng của bảng tìm kiếm nhanh (Ctrl+K), dùng chung giữa Header và layout.
let open = $state(false);

export const palette = {
  get open() { return open; },
  show() { open = true; },
  hide() { open = false; },
  toggle() { open = !open; }
};
