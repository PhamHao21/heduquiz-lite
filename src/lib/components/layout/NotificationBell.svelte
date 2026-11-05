<!-- src/lib/components/layout/NotificationBell.svelte -->
<script lang="ts">
  import { Bell } from 'lucide-svelte';
  import { page } from '$app/state';
  const unread = $derived(page.data.unread ?? 0);
</script>

<a href="/thong-bao" class="btn btn-ghost btn-icon relative" aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'} title="Thông báo">
  <Bell size={18} />
  {#if unread > 0}
    <span class="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-heart px-1 text-[10px] font-bold text-white">
      {unread > 9 ? '9+' : unread}
    </span>
  {/if}
</a>
