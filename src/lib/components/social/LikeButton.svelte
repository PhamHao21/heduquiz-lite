<!-- src/lib/components/social/LikeButton.svelte -->
<!-- Nút thả tim: cập nhật ngay trên giao diện (lạc quan), lỗi thì hoàn lại và báo. -->
<script lang="ts">
  import { Heart } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { setLike } from '$lib/supabase/social';
  import { toast } from '$lib/stores/toast.svelte';
  import { compactNumber } from '$lib/utils/time';

  interface Props { quizId: string; count?: number; liked?: boolean; variant?: 'pill' | 'chip' | 'overlay' }
  const props: Props = $props();

  // Giá trị từ server; bấm tim thì ghi đè tạm thời (lạc quan), tự đồng bộ lại khi dữ liệu server đổi
  let liked = $derived(props.liked ?? false);
  let count = $derived(props.count ?? 0);
  let busy = $state(false);
  let pop = $state(false);

  async function toggle(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const me = page.data.profile;
    if (!me) { goto(`/auth?next=${encodeURIComponent(page.url.pathname)}`); return; }
    if (busy) return;
    const next = !liked;
    liked = next;
    count = Math.max(0, count + (next ? 1 : -1));
    if (next) { pop = true; setTimeout(() => { pop = false; }, 450); }
    busy = true;
    try {
      await setLike(me.id, props.quizId, next);
    } catch (err) {
      liked = !next;
      count = Math.max(0, count + (next ? -1 : 1));
      toast.error(err instanceof Error ? err.message : 'Không thả tim được');
    } finally {
      busy = false;
    }
  }

  const variant = $derived(props.variant ?? 'pill');
  const tone = $derived(
    variant === 'pill'
      ? `btn btn-lg ${liked ? 'border border-heart/40 bg-heart-soft text-heart' : 'btn-secondary'}`
      : variant === 'chip'
        ? `rounded-full px-2.5 py-1 text-xs ${liked ? 'bg-heart-soft text-heart' : 'text-muted hover:bg-sunken hover:text-ink'}`
        : 'rounded-full bg-black/35 px-2.5 py-1 text-xs text-white backdrop-blur-sm hover:bg-black/50'
  );
</script>

<button
  onclick={toggle}
  aria-pressed={liked}
  aria-label={liked ? `Bỏ tim, ${count} lượt tim` : `Thả tim, ${count} lượt tim`}
  title={liked ? 'Bỏ tim' : 'Thả tim'}
  class="inline-flex items-center gap-1.5 font-semibold tabular-nums transition active:scale-95 {tone}"
>
  <Heart size={variant === 'pill' ? 18 : 14} fill={liked ? 'currentColor' : 'none'} class={pop ? 'heart-pop' : ''} />
  {compactNumber(count)}
</button>

<style>
  @media (prefers-reduced-motion: no-preference) {
    :global(.heart-pop) { animation: heart-pop 0.45s cubic-bezier(0.17, 0.89, 0.32, 1.49); }
  }
  @keyframes heart-pop {
    0% { transform: scale(1); }
    35% { transform: scale(1.35); }
    100% { transform: scale(1); }
  }
</style>
