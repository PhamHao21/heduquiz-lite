<!-- src/lib/components/quiz/Timer.svelte -->
<script lang="ts">
  interface Props {
    /** mốc hết giờ (ms, Date.now()) */
    endsAt: number;
    /** tổng thời gian (giây), chỉ dùng để vẽ vòng tiến độ */
    totalSeconds: number;
    onExpire?: () => void;
  }

  const { endsAt, totalSeconds, onExpire }: Props = $props();

  // Tính thời gian còn lại từ mốc hết giờ thay vì đếm lùi từng giây: trình duyệt làm chậm
  // setInterval khi tab bị ẩn, đếm lùi sẽ bị trễ; cách này luôn đúng giờ thật.
  const secondsLeft = () => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

  let remaining = $state(secondsLeft());
  let expired = false;

  const mm = $derived(String(Math.floor(remaining / 60)).padStart(2, '0'));
  const ss = $derived(String(remaining % 60).padStart(2, '0'));
  const danger = $derived(remaining <= 30);
  const pct    = $derived(totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 0);

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

<div class="flex flex-col items-center gap-1">
  <!-- Progress ring -->
  <div class="relative h-14 w-14">
    <svg class="h-full w-full -rotate-90" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor"
        class="text-slate-200 dark:text-slate-700" stroke-width="4"/>
      <circle cx="24" cy="24" r="20" fill="none"
        stroke="currentColor"
        class="{danger ? 'text-red-500' : 'text-indigo-500'} transition-colors"
        stroke-width="4"
        stroke-dasharray="125.66"
        stroke-dashoffset="{125.66 - (pct / 100) * 125.66}"
        stroke-linecap="round"
      />
    </svg>
    <span class="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold
      {danger ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}">
      {mm}:{ss}
    </span>
  </div>
</div>
