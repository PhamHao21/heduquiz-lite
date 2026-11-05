<!-- src/lib/components/quiz/Timer.svelte -->
<script lang="ts">
  import { Clock } from 'lucide-svelte';

  interface Props {
    /** mốc hết giờ (ms, Date.now()) */
    endsAt: number;
    /** tổng thời gian (giây), để vẽ thanh tiến độ */
    totalSeconds: number;
    onExpire?: () => void;
  }

  const { endsAt, totalSeconds, onExpire }: Props = $props();

  // Tính thời gian còn lại từ mốc hết giờ thay vì đếm lùi từng giây: trình duyệt làm chậm
  // setInterval khi tab bị ẩn, đếm lùi sẽ bị trễ; cách này luôn đúng giờ thật.
  const secondsLeft = () => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

  let remaining = $state(secondsLeft());
  let expired = false;

  const hh = $derived(Math.floor(remaining / 3600));
  const mm = $derived(String(Math.floor((remaining % 3600) / 60)).padStart(2, '0'));
  const ss = $derived(String(remaining % 60).padStart(2, '0'));
  const danger = $derived(remaining <= 60);
  const pct = $derived(totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 0);

  $effect(() => {
    const tick = () => {
      remaining = secondsLeft();
      if (remaining <= 0 && !expired) {
        expired = true;
        onExpire?.();
      }
    };
    tick();
    const id = setInterval(tick, 500);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  });
</script>

<div class="relative overflow-hidden rounded-xl border px-3 py-2 {danger ? 'border-danger bg-danger-soft text-danger' : 'border-line bg-surface text-ink'}"
  role="timer" aria-label="Thời gian còn lại">
  <span class="flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums">
    <Clock size={15} />
    {#if hh > 0}{hh}:{/if}{mm}:{ss}
  </span>
  <span class="absolute bottom-0 left-0 h-0.5 {danger ? 'bg-danger' : 'bg-accent'} transition-[width] duration-500" style="width:{pct}%"></span>
</div>
