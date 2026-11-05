<!-- src/lib/components/layout/Header.svelte -->
<script lang="ts">
  import { Plus } from 'lucide-svelte';
  import { page } from '$app/state';
  import Logo from './Logo.svelte';
  import UserMenu from './UserMenu.svelte';
  import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
  import NotificationBell from './NotificationBell.svelte';

  const { onCreate }: { onCreate: () => void } = $props();

  const profile = $derived(page.data.profile);
  const email = $derived(page.data.session?.user?.email);
  const path = $derived(page.url.pathname);

  const links = $derived([
    ...(profile ? [{ href: '/kho-de', label: 'Kho đề' }, { href: '/bang-tin', label: 'Bảng tin' }] : []),
    { href: '/kham-pha', label: 'Khám phá' },
    { href: '/xep-hang', label: 'Xếp hạng' }
  ]);
  const isActive = (href: string) => path === href || path.startsWith(`${href}/`);
</script>

<header class="no-print sticky top-0 z-[100] border-b border-line bg-canvas/85 backdrop-blur-md">
  <div class="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
    <Logo href={profile ? '/kho-de' : '/'} />

    <nav class="hidden items-center gap-1 md:flex" aria-label="Điều hướng chính">
      {#each links as l (l.href)}
        <a href={l.href}
          class="rounded-lg px-3 py-2 text-sm font-semibold transition {isActive(l.href) ? 'bg-surface text-ink shadow-sm ring-1 ring-line' : 'text-muted hover:text-ink'}"
          aria-current={isActive(l.href) ? 'page' : undefined}>
          {l.label}
        </a>
      {/each}
    </nav>

    <div class="ml-auto flex items-center gap-1.5">
      <ThemeToggle />
      {#if profile}
        <NotificationBell />
        <button class="btn btn-primary btn-sm hidden sm:inline-flex" onclick={onCreate}>
          <Plus size={16} strokeWidth={2.5} /> Tạo đề
        </button>
        <div class="ml-1.5"><UserMenu {profile} {email} /></div>
      {:else}
        <a href="/auth?next={encodeURIComponent(path)}" class="btn btn-primary btn-sm">Đăng nhập</a>
      {/if}
    </div>
  </div>
</header>
