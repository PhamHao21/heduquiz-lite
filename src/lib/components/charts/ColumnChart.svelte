<!-- src/lib/components/charts/ColumnChart.svelte -->
<!-- Biểu đồ cột một chuỗi theo ngày: cột ≤24px, bo 4px đầu cột, khe 2px; rê chuột / phím ←→ để xem số liệu. -->
<script lang="ts">
  import { columnPath, niceMax, shortDate } from './scale';

  interface Point { date: string; value: number; note?: string }
  interface Props {
    data: Point[];
    /** mô tả biểu đồ cho trình đọc màn hình */
    label: string;
    unit: string;
    height?: number;
    reference?: { value: number; label: string } | null;
  }
  const { data, label, unit, height = 220, reference = null }: Props = $props();

  let width = $state(640);
  let active = $state<number | null>(null);

  const M = { top: 14, right: 8, bottom: 24, left: 34 };
  const innerW = $derived(Math.max(0, width - M.left - M.right));
  const innerH = $derived(height - M.top - M.bottom);
  const max = $derived(niceMax(Math.max(...data.map(d => d.value), reference?.value ?? 0, 1)));
  const ticks = $derived([0, max / 2, max].map(t => (Number.isInteger(t) ? t : Math.round(t * 10) / 10)));
  const band = $derived(data.length ? innerW / data.length : 0);
  const barW = $derived(Math.max(2, Math.min(24, band - 2)));
  const y = (v: number) => M.top + innerH - (v / max) * innerH;
  const labelEvery = $derived(Math.max(1, Math.ceil(data.length / Math.max(1, innerW / 46))));

  const tip = $derived(active !== null ? data[active] : null);
  const tipX = $derived(active !== null ? M.left + active * band + band / 2 : 0);

  function onKeydown(e: KeyboardEvent) {
    if (!data.length) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); active = active === null ? data.length - 1 : Math.min(data.length - 1, active + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); active = active === null ? data.length - 1 : Math.max(0, active - 1); }
    else if (e.key === 'Escape') active = null;
  }
</script>

<div class="relative" bind:clientWidth={width}>
  <!-- Biểu đồ nhận phím ←/→ để xem từng ngày (tiện cho người dùng bàn phím); bảng số liệu đi kèm là đường chính cho trình đọc màn hình. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <svg
    {width}
    {height}
    role="img"
    aria-label="{label}. Dùng phím mũi tên trái phải để xem từng ngày."
    tabindex="0"
    class="block overflow-visible outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
    onkeydown={onKeydown}
    onblur={() => { active = null; }}
    onpointerleave={() => { active = null; }}
  >
    <!-- lưới ngang mảnh, nhạt -->
    {#each ticks as t (t)}
      <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke="var(--line)" stroke-width="1" />
      <text x={M.left - 6} y={y(t)} dy="0.32em" text-anchor="end" class="fill-faint text-[10px] tabular-nums">{t}</text>
    {/each}


    {#each data as d, i (d.date)}
      {@const x = M.left + i * band + (band - barW) / 2}
      {#if d.value > 0}
        <path d={columnPath(x, y(d.value), barW, M.top + innerH - y(d.value))}
          fill="var(--accent)" opacity={active === null || active === i ? 1 : 0.45} class="transition-opacity" />
      {/if}
      <!-- vùng bắt chuột rộng hơn cột -->
      <rect x={M.left + i * band} y={M.top} width={band} height={innerH} fill="transparent"
        role="presentation" onpointerenter={() => { active = i; }} />
      <!-- nhãn đều đặn, bỏ nhãn quá sát nhãn cuối để không dính chữ -->
      {#if (i % labelEvery === 0 && data.length - 1 - i >= Math.ceil(labelEvery / 2)) || i === data.length - 1}
        <text x={M.left + i * band + band / 2} y={height - 6} text-anchor="middle" class="fill-faint text-[10px] tabular-nums">{shortDate(d.date)}</text>
      {/if}
    {/each}

    <!-- đường mục tiêu vẽ sau cột để nhãn không bị cột che -->
    {#if reference && reference.value > 0}
      <line x1={M.left} x2={width - M.right} y1={y(reference.value)} y2={y(reference.value)} stroke="var(--muted)" stroke-width="1" stroke-dasharray="4 3" />
      <text x={width - M.right} y={y(reference.value) - 5} text-anchor="end" class="fill-muted text-[10px] font-semibold" stroke="var(--surface)" stroke-width="4" stroke-linejoin="round" paint-order="stroke">{reference.label}</text>
    {/if}
  </svg>

  {#if tip}
    <div class="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg"
      style="left:{Math.min(Math.max(tipX, 70), width - 70)}px">
      <p class="text-sm font-bold tabular-nums text-ink">{tip.value.toLocaleString('vi-VN')} {unit}</p>
      <p class="whitespace-nowrap text-muted">{shortDate(tip.date)}{tip.note ? ` · ${tip.note}` : ''}</p>
    </div>
  {/if}
</div>
