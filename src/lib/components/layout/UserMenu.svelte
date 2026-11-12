<!-- src/lib/components/layout/UserMenu.svelte -->
<script lang="ts">
  import { UserRound, Settings, LogOut, BarChart3, History, Bookmark, LifeBuoy } from 'lucide-svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import { authStore } from '$lib/stores/auth.svelte';
  import { invalidateAll, goto } from '$app/navigation';

  interface Props { profile: { username: string; display_name: string | null; avatar_url: string | null }; email?: string }
  const { profile, email }: Props = $props();

  let open = $state(false);
  let root = $state<HTMLDivElement>();

  function onWindowClick(e: MouseEvent) {
    if (open && root && !root.contains(e.target as Node)) open = false;
  }
  function onKeydown(e: KeyboardEvent) {
    if (open && e.key === 'Escape') open = false;
  }

  const links = $derived([
    { href: `/u/${profile.username}`, label: 'Trang cá nhân', icon: UserRound },
    { href: '/thong-ke', label: 'Thống kê học tập', icon: BarChart3 },
    { href: '/lich-su', label: 'Lịch sử làm bài', icon: History },
    { href: '/bo-suu-tap', label: 'Bộ sưu tập', icon: Bookmark },
    { href: '/thiet-lap', label: 'Thiết lập', icon: Settings },
    { href: '/huong-dan', label: 'Hướng dẫn', icon: LifeBuoy }
  ]);

  async function signOut() {
    open = false;
    await authStore.signOut();
    await invalidateAll();
    await goto('/');
  }
</script>

<svelte:window onclick={onWindowClick} onkeydown={onKeydown} />

<div class="relative" bind:this={root}>
  <button
    class="flex items-center rounded-full ring-offset-2 ring-offset-canvas transition hover:ring-2 hover:ring-line-strong"
    aria-haspopup="menu"
    aria-expanded={open}
    aria-label="Mở menu tài khoản"
    onclick={() => { open = !open; }}
  >
    <Avatar name={profile.display_name ?? profile.username} src={profile.avatar_url} size={34} />
  </button>

  {#if open}
    <div class="card rise-in absolute right-0 top-12 z-[120] w-60 p-1.5 shadow-lg" role="menu">
      <div class="px-3 py-2.5">
        <p class="truncate text-sm font-semibold text-ink">{profile.display_name ?? profile.username}</p>
        {#if email}<p class="truncate text-xs text-muted">{email}</p>{/if}
      </div>
      <div class="my-1 h-px bg-line"></div>
      {#each links as l (l.href)}
        <a href={l.href} role="menuitem" class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink hover:bg-sunken" onclick={() => { open = false; }}>
          <l.icon size={16} class="text-muted" /> {l.label}
        </a>
      {/each}
      <div class="my-1 h-px bg-line"></div>
      <button role="menuitem" class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-soft" onclick={signOut}>
        <LogOut size={16} /> Đăng xuất
      </button>
    </div>
  {/if}
</div>
