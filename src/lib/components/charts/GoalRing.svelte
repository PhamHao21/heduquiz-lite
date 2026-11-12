<!-- src/lib/components/charts/GoalRing.svelte -->
<!-- Vòng tiến độ mục tiêu ngày: phần chưa đạt là tông nhạt của cùng màu; đạt mục tiêu thì chuyển xanh lá. -->
<script lang="ts">
  interface Props { value: number; goal: number; size?: number }
  const { value, goal, size = 96 }: Props = $props();
  const r = $derived(size / 2 - 7);
  const C = $derived(2 * Math.PI * r);
  const ratio = $derived(goal > 0 ? Math.min(1, value / goal) : 0);
  const done = $derived(value >= goal && goal > 0);
</script>

<div class="relative shrink-0" style="width:{size}px;height:{size}px"
  role="img" aria-label="Hôm nay {value} trên {goal} câu ({Math.round(ratio * 100)}%)">
  <svg viewBox="0 0 {size} {size}" class="h-full w-full -rotate-90">
    <circle cx={size / 2} cy={size / 2} {r} fill="none" stroke={done ? 'var(--success-soft)' : 'var(--accent-soft)'} stroke-width="8" />
    {#if ratio > 0}
      <circle cx={size / 2} cy={size / 2} {r} fill="none" stroke={done ? 'var(--success)' : 'var(--accent)'} stroke-width="8"
        stroke-linecap="round" stroke-dasharray={C} stroke-dashoffset={C * (1 - ratio)} class="transition-[stroke-dashoffset] duration-700" />
    {/if}
  </svg>
  <span class="absolute inset-0 flex flex-col items-center justify-center leading-none">
    <span class="text-xl font-extrabold">{value}</span>
    <span class="mt-1 text-[10px] font-semibold text-muted">/ {goal} câu</span>
  </span>
</div>
