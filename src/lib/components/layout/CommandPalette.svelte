<!-- src/lib/components/layout/CommandPalette.svelte -->
<!-- Tìm kiếm nhanh toàn trang (Ctrl/Cmd + K hoặc phím /): đi tới trang, chạy lệnh,
     tìm đề / người dùng / bộ sưu tập. Điều khiển hoàn toàn bằng bàn phím (↑ ↓ Enter Esc). -->
<script lang="ts">
  import {
    Search, PenLine, LibraryBig, Newspaper, Compass, Trophy, BarChart3, History, Bookmark, Bell,
    UserRound, Settings, LifeBuoy, SunMoon, LogIn, FileText, Lock, CornerDownLeft, Layers
  } from 'lucide-svelte';
  import type { Icon as LucideIcon } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { tick } from 'svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import { palette } from '$lib/stores/palette.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { matchesQuery } from '$lib/utils/text';
  import { coverStyle, initials } from '$lib/utils/cover';
  import type { SearchResults } from '$lib/utils/searchTypes';

  const { onCreate }: { onCreate: () => void } = $props();

  type Item = {
    id: string; group: string; label: string; sub?: string;
    icon?: typeof LucideIcon; avatar?: { name: string; src: string | null }; cover?: string;
    href?: string; run?: () => void;
  };

  let query = $state('');
  let active = $state(0);
  let results = $state<SearchResults | null>(null);
  let loading = $state(false);
  let input = $state<HTMLInputElement>();
  let list = $state<HTMLUListElement>();

  const profile = $derived(page.data.profile);

  const actions = $derived<(Item & { keywords: string; auth?: boolean; guest?: boolean })[]>([
    { id: 'a-create', group: 'Lệnh', label: 'Tạo đề mới', icon: PenLine, run: onCreate, keywords: 'soan de tao moi them', auth: true },
    { id: 'a-kho', group: 'Đi tới', label: 'Kho đề của tôi', icon: LibraryBig, href: '/kho-de', keywords: 'kho de cua toi thu vien', auth: true },
    { id: 'a-feed', group: 'Đi tới', label: 'Bảng tin', icon: Newspaper, href: '/bang-tin', keywords: 'bang tin feed theo doi', auth: true },
    { id: 'a-explore', group: 'Đi tới', label: 'Khám phá đề công khai', icon: Compass, href: '/kham-pha', keywords: 'kham pha de cong khai' },
    { id: 'a-rank', group: 'Đi tới', label: 'Bảng xếp hạng', icon: Trophy, href: '/xep-hang', keywords: 'xep hang bang top' },
    { id: 'a-stats', group: 'Đi tới', label: 'Thống kê học tập', icon: BarChart3, href: '/thong-ke', keywords: 'thong ke bieu do thanh tich muc tieu', auth: true },
    { id: 'a-history', group: 'Đi tới', label: 'Lịch sử làm bài', icon: History, href: '/lich-su', keywords: 'lich su ket qua lam bai', auth: true },
    { id: 'a-collections', group: 'Đi tới', label: 'Bộ sưu tập', icon: Bookmark, href: '/bo-suu-tap', keywords: 'bo suu tap danh sach luu' },
    { id: 'a-notif', group: 'Đi tới', label: 'Thông báo', icon: Bell, href: '/thong-bao', keywords: 'thong bao', auth: true },
    ...(profile ? [{ id: 'a-me', group: 'Đi tới', label: 'Trang cá nhân', icon: UserRound, href: `/u/${profile.username}`, keywords: 'trang ca nhan ho so profile', auth: true }] : []),
    { id: 'a-settings', group: 'Đi tới', label: 'Thiết lập tài khoản', icon: Settings, href: '/thiet-lap', keywords: 'thiet lap cai dat tai khoan muc tieu', auth: true },
    { id: 'a-help', group: 'Đi tới', label: 'Hướng dẫn sử dụng', icon: LifeBuoy, href: '/huong-dan', keywords: 'huong dan tro giup cu phap cau hoi faq' },
    { id: 'a-theme', group: 'Lệnh', label: themeStore.isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối', icon: SunMoon, run: () => themeStore.toggle(), keywords: 'giao dien sang toi dark light theme' },
    { id: 'a-login', group: 'Lệnh', label: 'Đăng nhập', icon: LogIn, href: '/auth', keywords: 'dang nhap dang ky login', guest: true }
  ]);

  const visibleActions = $derived(actions.filter(a => (a.auth ? !!profile : a.guest ? !profile : true)));

  const items = $derived.by<Item[]>(() => {
    const q = query.trim();
    if (!q) return visibleActions;
    const out: Item[] = visibleActions.filter(a => matchesQuery(`${a.label} ${a.keywords}`, q)).slice(0, 4);
    if (results) {
      for (const m of results.mine) out.push({ id: `m-${m.id}`, group: 'Đề của tôi', label: m.title, sub: m.question_count != null ? `${m.question_count} câu` : undefined, cover: m.id, href: `/quiz/${m.id}` });
      for (const x of results.quizzes) out.push({ id: `q-${x.id}`, group: 'Đề công khai', label: x.title, sub: [x.owner_name, x.question_count != null ? `${x.question_count} câu` : null].filter(Boolean).join(' · '), cover: x.id, href: `/quiz/${x.id}` });
      for (const p of results.people) out.push({ id: `p-${p.id}`, group: 'Người dùng', label: p.display_name ?? p.username, sub: `@${p.username}`, avatar: { name: p.display_name ?? p.username, src: p.avatar_url }, href: `/u/${p.username}` });
      for (const c of results.collections) out.push({ id: `c-${c.id}`, group: 'Bộ sưu tập', label: c.title, sub: `${c.item_count} đề${c.owner_name ? ` · ${c.owner_name}` : ''}`, icon: Layers, href: `/bo-suu-tap/${c.id}` });
    }
    out.push({ id: 'all', group: 'Tìm kiếm', label: `Xem tất cả kết quả cho "${q}"`, icon: Search, href: `/tim-kiem?q=${encodeURIComponent(q)}` });
    return out;
  });

  // Nhóm liên tiếp theo group để vẽ tiêu đề nhóm
  const groups = $derived.by(() => {
    const g: { name: string; items: { item: Item; index: number }[] }[] = [];
    items.forEach((item, index) => {
      const last = g[g.length - 1];
      if (last && last.name === item.group) last.items.push({ item, index });
      else g.push({ name: item.group, items: [{ item, index }] });
    });
    return g;
  });

  // Gõ tới đâu tìm tới đó (trễ 180ms, huỷ yêu cầu cũ)
  $effect(() => {
    const q = query.trim();
    active = 0;
    if (q.length < 2) { results = null; loading = false; return; }
    const ctrl = new AbortController();
    loading = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (res.ok) results = await res.json();
      } catch {
        // bị huỷ hoặc mất mạng: giữ kết quả cũ
      } finally {
        if (!ctrl.signal.aborted) loading = false;
      }
    }, 180);
    return () => { clearTimeout(timer); ctrl.abort(); };
  });

  $effect(() => {
    if (palette.open) {
      tick().then(() => input?.focus());
    } else {
      query = '';
      results = null;
    }
  });

  function select(item: Item | undefined) {
    if (!item) return;
    palette.hide();
    if (item.run) item.run();
    else if (item.href) goto(item.href);
  }

  async function move(delta: number) {
    if (items.length === 0) return;
    active = (active + delta + items.length) % items.length;
    await tick();
    list?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }

  function onInputKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); select(items[active]); }
    else if (e.key === 'Tab') { e.preventDefault(); move(e.shiftKey ? -1 : 1); }
  }

  function isTyping(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
  }

  function onWindowKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      palette.toggle();
    } else if (e.key === '/' && !palette.open && !isTyping(e.target) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      palette.show();
    } else if (e.key === 'Escape' && palette.open) {
      palette.hide();
    }
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#if palette.open}
  <div class="fixed inset-0 z-[160] flex items-start justify-center px-3 pt-[8vh] sm:pt-[12vh]">
    <button class="absolute inset-0 bg-black/45 backdrop-blur-[2px]" aria-label="Đóng tìm kiếm" tabindex="-1" onclick={() => palette.hide()}></button>
    <div class="card rise-in relative flex max-h-[76vh] w-full max-w-xl flex-col overflow-hidden shadow-xl" role="dialog" aria-modal="true" aria-label="Tìm kiếm nhanh">
      <div class="flex items-center gap-3 border-b border-line px-4">
        <Search size={18} class="shrink-0 text-muted" />
        <input bind:this={input} bind:value={query} onkeydown={onInputKeydown}
          class="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-faint"
          placeholder="Tìm đề, người dùng, hoặc gõ lệnh..." autocomplete="off" spellcheck="false"
          role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list"
          aria-activedescendant={items[active] ? `pal-${items[active].id}` : undefined} />
        {#if loading}<span class="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-line border-t-accent" aria-label="Đang tìm"></span>{/if}
        <kbd class="hidden shrink-0 rounded-md border border-line bg-sunken px-1.5 py-0.5 font-mono text-[11px] text-muted sm:block">Esc</kbd>
      </div>

      <ul bind:this={list} id="palette-list" role="listbox" aria-label="Kết quả" class="flex-1 overflow-y-auto p-2">
        {#each groups as g (g.name + g.items[0].index)}
          <li role="presentation" class="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-faint first:pt-1">{g.name}</li>
          {#each g.items as { item, index } (item.id)}
            <li id="pal-{item.id}" role="option" aria-selected={index === active} data-index={index}>
              <button tabindex="-1" onclick={() => select(item)} onmousemove={() => { active = index; }}
                class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors {index === active ? 'bg-accent-soft' : ''}">
                {#if item.avatar}
                  <Avatar name={item.avatar.name} src={item.avatar.src} size={30} />
                {:else if item.cover}
                  <span class="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold text-white/90" style={coverStyle(item.cover)} aria-hidden="true">{initials(item.label)}</span>
                {:else if item.icon}
                  <span class="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg {index === active ? 'bg-surface text-accent' : 'bg-sunken text-muted'}"><item.icon size={16} /></span>
                {/if}
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-semibold {index === active ? 'text-accent-ink' : 'text-ink'}">{item.label}</span>
                  {#if item.sub}<span class="block truncate text-xs text-muted">{item.sub}</span>{/if}
                </span>
                {#if item.group === 'Đề của tôi'}<Lock size={13} class="shrink-0 text-faint" />{/if}
                {#if index === active}<CornerDownLeft size={14} class="shrink-0 text-muted" />{/if}
              </button>
            </li>
          {/each}
        {/each}
        {#if query.trim().length >= 2 && results && !loading && results.quizzes.length + results.mine.length + results.people.length + results.collections.length === 0}
          <li role="presentation" class="px-3 py-4 text-center text-sm text-muted">Không có kết quả nhanh. Bấm Enter ở dòng cuối để tìm kỹ hơn.</li>
        {/if}
      </ul>

      <div class="hidden items-center gap-4 border-t border-line bg-sunken/60 px-4 py-2.5 text-[11px] text-muted sm:flex">
        <span class="inline-flex items-center gap-1"><kbd class="rounded border border-line bg-surface px-1 font-mono">↑</kbd><kbd class="rounded border border-line bg-surface px-1 font-mono">↓</kbd> chọn</span>
        <span class="inline-flex items-center gap-1"><kbd class="rounded border border-line bg-surface px-1 font-mono">Enter</kbd> mở</span>
        <span class="inline-flex items-center gap-1"><kbd class="rounded border border-line bg-surface px-1 font-mono">Ctrl K</kbd> đóng / mở</span>
        <a href="/huong-dan#phim-tat" onclick={() => palette.hide()} class="ml-auto inline-flex items-center gap-1 hover:text-ink"><FileText size={12} /> Phím tắt</a>
      </div>
    </div>
  </div>
{/if}
