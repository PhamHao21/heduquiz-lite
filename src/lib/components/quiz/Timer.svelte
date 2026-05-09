<!-- src/lib/components/quiz/Timer.svelte -->
<script lang="ts">
  interface Props {
    seconds: number;        // total seconds (read-only initial)
    onExpire?: () => void;
  }

  const { seconds, onExpire }: Props = $props();

  let remaining = $state(seconds);
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const mm = $derived(String(Math.floor(remaining / 60)).padStart(2, '0'));
  const ss = $derived(String(remaining % 60).padStart(2, '0'));
  const danger = $derived(remaining <= 30);
  const pct    = $derived((remaining / seconds) * 100);

  $effect(() => {
    intervalId = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(intervalId!);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(intervalId!);
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
