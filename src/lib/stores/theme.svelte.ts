// src/lib/stores/theme.svelte.ts
// Giao diện sáng / tối / theo hệ thống. Lưu lựa chọn trong localStorage (chỉ là tiện ích
// trên từng máy); script trong app.html áp dụng trước khi trang hiện ra để không nháy màu.
export type ThemePref = 'light' | 'dark' | 'system';

const KEY = 'hedu:theme';

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

let pref = $state<ThemePref>('system');
let isDark = $state(false);

function apply() {
  const systemDark = matchMedia('(prefers-color-scheme: dark)').matches;
  isDark = pref === 'dark' || (pref === 'system' && systemDark);
  document.documentElement.classList.toggle('dark', isDark);
}

if (typeof window !== 'undefined') {
  pref = readPref();
  apply();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (pref === 'system') apply();
  });
}

export const themeStore = {
  get pref() { return pref; },
  get isDark() { return isDark; },
  set(next: ThemePref) {
    pref = next;
    try {
      if (next === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {
      // localStorage bị chặn: vẫn đổi giao diện cho phiên hiện tại
    }
    apply();
  },
  toggle() {
    this.set(isDark ? 'light' : 'dark');
  }
};
