<!-- src/lib/components/layout/BottomNav.svelte -->
<!-- Thanh điều hướng dưới đáy màn hình trên điện thoại (giống ứng dụng). -->
<script lang="ts">
  import { LibraryBig, Compass, Trophy, Plus, UserRound, Home, LogIn, Newspaper } from 'lucide-svelte';
  import { page } from '$app/state';

  const { onCreate }: { onCreate: () => void } = $props();

  const profile = $derived(page.data.profile);
  const path = $derived(page.url.pathname);
  const isActive = (href: string) => path === href || path.startsWith(`${href}/`);

  const items = $derived(
    profile
      ? [
          { href: '/kho-de', label: 'Kho đề', icon: LibraryBig },
          { href: '/bang-tin', label: 'Bảng tin', icon: Newspaper },
          null,
          { href: '/kham-pha', label: 'Khám phá', icon: Compass },
          { href: `/u/${profile.username}`, label: 'Tôi', icon: UserRound }
        ]
      : [
          { href: '/', label: 'Trang chủ', icon: Home },
          { href: '/kham-pha', label: 'Khám phá', icon: Compass },
          { href: '/xep-hang', label: 'Xếp hạng', icon: Trophy },
          { href: '/auth', label: 'Đăng nhập', icon: LogIn }
        ]
  );
</script>

<nav class="no-print fixed inset-x-0 bottom-0 z-[100] border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
  aria-label="Điều hướng">
  <ul class="mx-auto flex max-w-md items-stretch justify-around px-2">
    {#each items as item, i (item?.href ?? `create-${i}`)}
      <li class="flex flex-1 justify-center">
        {#if item}
          {@const active = item.href === '/' ? path === '/' : isActive(item.href)}
          <a href={item.href}
            class="flex w-full flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition {active ? 'text-accent' : 'text-faint'}"
            aria-current={active ? 'page' : undefined}>
            <item.icon size={22} strokeWidth={active ? 2.25 : 1.75} />
            {item.label}
          </a>
        {:else}
          <button onclick={onCreate} aria-label="Tạo đề mới"
            class="my-1.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-on-accent shadow-md transition active:scale-95">
            <Plus size={24} strokeWidth={2.5} />
          </button>
        {/if}
      </li>
    {/each}
  </ul>
</nav>
