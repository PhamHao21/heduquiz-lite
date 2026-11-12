<!-- src/lib/components/charts/LineChart.svelte -->
<!-- Đường tỉ lệ (0..100%) theo ngày: nét 2px, ngày không có dữ liệu để trống, vạch dò theo ngày khi rê chuột. -->
<script lang="ts">
  import { shortDate } from './scale';

  interface Point { date: string; value: number | null; note?: string }
  interface Props { data: Point[]; label: string; height?: number }
  const { data, label, height = 200 }: Props = $props();

  let width = $state(640);
  let active = $state<number | null>(null);

  const M = { top: 14, right: 12, bottom: 24, left: 40 };
  const innerW = $derived(Math.max(0, width - M.left - M.right));
  const innerH = $derived(height - M.top - M.bottom);
  const x = (i: number) => M.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => M.top + innerH - v * innerH;
  const labelEvery = $derived(Math.max(1, Math.ceil(data.length / Math.max(1, innerW / 46))));

  // Tách đường thành các đoạn liền nhau (bỏ qua ngày không có dữ liệu)
  const segments = $derived.by(() => {
    const out: { i: number; v: number }[][] = [];
    let cur: { i: number; v: number }[] = [];
    data.forEach((d, i) => {
      if (d.value === null) { if (cur.length) out.push(cur); cur = []; }
      else cur.push({ i, v: d.value });
    });
    if (cur.length) out.push(cur);
    return out;
  });
  const linePath = (seg: { i: number; v: number }[]) => seg.map((p, k) => `${k ? 'L' : 'M'}${x(p.i)},${y(p.v)}`).join('');
  const areaPath = (seg: { i: number; v: number }[]) =>
    `${linePath(seg)}L${x(seg[seg.length - 1].i)},${M.top + innerH}L${x(seg[0].i)},${M.top + innerH}Z`;

  const tip = $derived(active !== null ? data[active] : null);

  function nearest(e: PointerEvent) {
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const px = e.clientX - rect.left;
    if (!data.length) return;
    active = Math.round(((px - M.left) / Math.max(1, innerW)) * (data.length - 1));
    active = Math.max(0, Math.min(data.length - 1, active));
  }
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
  <svg {width} {height} role="img" aria-label="{label}. Dùng phím mũi tên trái phải để xem từng ngày." tabindex="0"
    class="block overflow-visible rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent"
    onpointermove={nearest} onpointerleave={() => { active = null; }} onkeydown={onKeydown} onblur={() => { active = null; }}>
    {#each [0, 0.5, 1] as t (t)}
      <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke="var(--line)" stroke-width="1" />
      <text x={M.left - 6} y={y(t)} dy="0.32em" text-anchor="end" class="fill-faint text-[10px] tabular-nums">{t * 100}%</text>
    {/each}

    {#each segments as seg, si (si)}
      <path d={areaPath(seg)} fill="var(--accent)" opacity="0.1" />
      {#if seg.length > 1}
        <path d={linePath(seg)} fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      {:else}
        <!-- ngày lẻ loi: chấm thay cho đường -->
        <circle cx={x(seg[0].i)} cy={y(seg[0].v)} r="4" fill="var(--accent)" stroke="var(--surface)" stroke-width="2" />
      {/if}
    {/each}

    {#if active !== null}
      <line x1={x(active)} x2={x(active)} y1={M.top} y2={M.top + innerH} stroke="var(--line-strong)" stroke-width="1" />
      {#if tip?.value !== null && tip?.value !== undefined}
        <circle cx={x(active)} cy={y(tip.value)} r="5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2" />
      {/if}
    {/if}

    {#each data as d, i (d.date)}
      {#if i % labelEvery === 0 || i === data.length - 1}
        <text x={x(i)} y={height - 6} text-anchor="middle" class="fill-faint text-[10px] tabular-nums">{shortDate(d.date)}</text>
      {/if}
    {/each}
  </svg>

  {#if tip && active !== null}
    <div class="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg"
      style="left:{Math.min(Math.max(x(active), 70), width - 70)}px">
      <p class="text-sm font-bold tabular-nums text-ink">{tip.value === null ? 'Không ôn' : `${Math.round(tip.value * 100)}% đúng`}</p>
      <p class="whitespace-nowrap text-muted">{shortDate(tip.date)}{tip.note ? ` · ${tip.note}` : ''}</p>
    </div>
  {/if}
</div>
