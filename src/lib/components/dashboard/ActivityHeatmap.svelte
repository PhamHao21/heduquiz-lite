<!-- src/lib/components/dashboard/ActivityHeatmap.svelte -->
<!-- Lịch hoạt động: mỗi ô là một ngày, cột là tuần (bắt đầu thứ Hai), màu đậm dần theo số lượt ôn. -->
<script lang="ts">
  import type { ActivityDay } from '$lib/utils/activity';

  const { days }: { days: ActivityDay[] } = $props();

  const WEEKDAYS = ['T2', '', 'T4', '', 'T6', '', 'CN'];

  // Thêm ô trống ở đầu để cột đầu tiên bắt đầu từ thứ Hai.
  const cells = $derived.by(() => {
    if (days.length === 0) return [] as (ActivityDay | null)[];
    const first = new Date(`${days[0].date}T00:00:00Z`).getUTCDay(); // 0 = CN
    const pad = (first + 6) % 7;
    return [...Array<ActivityDay | null>(pad).fill(null), ...days];
  });

  const level = (n: number) => (n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : 4);
  const tone = ['bg-sunken', 'bg-accent/25', 'bg-accent/45', 'bg-accent/70', 'bg-accent'];
  const fmt = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
</script>

<div class="flex gap-2">
  <div class="grid grid-rows-7 gap-[3px] pt-px text-[9px] font-medium leading-[11px] text-faint" aria-hidden="true">
    {#each WEEKDAYS as w, i (i)}<span class="h-[11px]">{w}</span>{/each}
  </div>
  <div class="grid grid-flow-col grid-rows-7 gap-[3px]" role="img"
    aria-label="Lịch hoạt động {days.length} ngày gần nhất">
    {#each cells as c, i (i)}
      {#if c}
        <span class="h-[11px] w-[11px] rounded-[3px] {tone[level(c.count)]}"
          title="{fmt(c.date)}: {c.count === 0 ? 'chưa ôn' : `${c.count} lượt ôn`}"></span>
      {:else}
        <span class="h-[11px] w-[11px]"></span>
      {/if}
    {/each}
  </div>
</div>
<div class="mt-3 flex items-center justify-end gap-1 text-[10px] text-faint" aria-hidden="true">
  Ít
  {#each tone as t (t)}<span class="h-[10px] w-[10px] rounded-[3px] {t}"></span>{/each}
  Nhiều
</div>
