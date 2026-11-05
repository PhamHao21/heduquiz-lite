<!-- src/lib/components/social/FollowButton.svelte -->
<script lang="ts">
  import { UserPlus, UserCheck } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { setFollow } from '$lib/supabase/social';
  import { toast } from '$lib/stores/toast.svelte';

  interface Props { userId: string; following?: boolean; size?: 'sm' | 'md'; onchange?: (following: boolean) => void }
  const props: Props = $props();

  // Giá trị từ server; bấm nút thì ghi đè tạm thời (lạc quan) cho tới khi dữ liệu server đổi
  let following = $derived(props.following ?? false);
  let busy = $state(false);
  let hover = $state(false);

  async function toggle(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const me = page.data.profile;
    if (!me) { goto(`/auth?next=${encodeURIComponent(page.url.pathname)}`); return; }
    if (busy || me.id === props.userId) return;
    const next = !following;
    following = next;
    hover = false; // vừa bấm xong hiện 'Đang theo dõi'; rê chuột vào lại mới hiện 'Bỏ theo dõi'
    props.onchange?.(next);
    busy = true;
    try {
      await setFollow(me.id, props.userId, next);
    } catch (err) {
      following = !next;
      props.onchange?.(!next);
      toast.error(err instanceof Error ? err.message : 'Không thực hiện được');
    } finally {
      busy = false;
    }
  }
</script>

{#if page.data.profile?.id !== props.userId}
  <button
    onclick={toggle}
    onmouseenter={() => { hover = true; }}
    onmouseleave={() => { hover = false; }}
    aria-pressed={following}
    class="btn {props.size === 'sm' ? 'btn-sm' : ''} {following ? (hover ? 'border border-danger bg-danger-soft text-danger' : 'btn-secondary') : 'btn-primary'}"
  >
    {#if following}
      <UserCheck size={props.size === 'sm' ? 14 : 16} /> {hover ? 'Bỏ theo dõi' : 'Đang theo dõi'}
    {:else}
      <UserPlus size={props.size === 'sm' ? 14 : 16} /> Theo dõi
    {/if}
  </button>
{/if}
