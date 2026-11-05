<!-- src/routes/thong-bao/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Bell, Heart, UserPlus, MessageCircle } from 'lucide-svelte';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import { markNotificationsRead } from '$lib/supabase/social';
  import { timeAgo } from '$lib/utils/time';

  const { data } = $props();

  const meta = {
    follow: { icon: UserPlus, tone: 'bg-accent-soft text-accent', text: 'đã theo dõi bạn' },
    like: { icon: Heart, tone: 'bg-heart-soft text-heart', text: 'đã thả tim đề' },
    comment: { icon: MessageCircle, tone: 'bg-success-soft text-success', text: 'đã bình luận về đề' }
  } as const;

  // Mở trang là đánh dấu đã đọc tất cả (ô đánh dấu "mới" vẫn hiện trong lần xem này)
  onMount(async () => {
    const me = page.data.profile;
    if (!me || !data.items.some(n => !n.read_at)) return;
    await markNotificationsRead(me.id);
    await invalidateAll();
  });
</script>

<svelte:head><title>Thông báo · HeduQuiz</title></svelte:head>

<div class="mx-auto max-w-2xl space-y-5">
  <h1 class="text-3xl font-extrabold tracking-tight">Thông báo</h1>

  {#if data.unavailable}
    <p class="rounded-xl bg-warning-soft px-5 py-4 text-sm text-warning">Thông báo chưa sẵn sàng: database chưa được cập nhật (migration 008).</p>
  {:else if data.items.length === 0}
    <EmptyState icon={Bell} title="Chưa có thông báo nào" description="Khi có người theo dõi bạn, thả tim hoặc bình luận đề của bạn, thông báo sẽ hiện ở đây." />
  {:else}
    <ul class="card divide-y divide-line overflow-hidden">
      {#each data.items as n (n.id)}
        {@const m = meta[n.type]}
        {@const href = n.type === 'follow' ? `/u/${n.actor?.username}` : `/quiz/${n.quiz_id}${n.type === 'comment' ? '#binh-luan' : ''}`}
        <li>
          <a {href} class="flex items-start gap-3 px-5 py-4 transition hover:bg-sunken {n.read_at ? '' : 'bg-accent-soft/40'}">
            <span class="relative shrink-0">
              <Avatar name={n.actor?.display_name ?? n.actor?.username} src={n.actor?.avatar_url} size={40} />
              <span class="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-surface {m.tone}">
                <m.icon size={11} />
              </span>
            </span>
            <span class="min-w-0 flex-1 text-sm">
              <span class="font-bold">{n.actor?.display_name ?? n.actor?.username ?? 'Ai đó'}</span>
              <span class="text-muted"> {m.text}</span>
              {#if n.quiz}<span class="font-semibold"> {n.quiz.title}</span>{/if}
              {#if n.comment}<span class="mt-1 line-clamp-2 block text-muted">"{n.comment.content}"</span>{/if}
              <span class="mt-0.5 block text-xs text-faint">{timeAgo(n.created_at)}</span>
            </span>
            {#if !n.read_at}<span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Chưa đọc"></span>{/if}
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>
