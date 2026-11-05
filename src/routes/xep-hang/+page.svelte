<!-- src/routes/xep-hang/+page.svelte -->
<script lang="ts">
  import { Trophy, Flame, PenLine } from 'lucide-svelte';

  const { data } = $props();

  const KIND_TABS = [
    { key: 'on-thi', label: 'Ôn thi chăm nhất', short: 'Ôn thi', icon: Flame },
    { key: 'tao-de', label: 'Tạo đề nhiều nhất', short: 'Tạo đề', icon: PenLine }
  ] as const;
  const PERIOD_TABS = [
    { key: 'tuan', label: '7 ngày' },
    { key: 'thang', label: '30 ngày' },
    { key: 'tat-ca', label: 'Tất cả' }
  ] as const;

  const hrefWith = (kind: string, period: string) => `/xep-hang?loai=${kind}&ky=${period}`;
  const isLearners = $derived(data.kind === 'on-thi');
  const myRow = $derived(data.myId ? data.rows.find(r => r.user_id === data.myId) : undefined);
  const medal = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null);

  const tab = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition ${active ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-500 hover:bg-slate-100'}`;
  const pill = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-bold transition ${active ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200'}`;
</script>

<svelte:head>
  <title>Bảng xếp hạng — HeduQuiz</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-5" style="color:#1e293b;">
  <div class="rounded-[2.5rem] bg-gradient-to-br from-amber-500 to-orange-600 p-7 text-white shadow-xl shadow-orange-100">
    <h1 class="flex items-center gap-2 text-2xl font-black uppercase tracking-tight"><Trophy size={24} /> Bảng xếp hạng</h1>
    <p class="mt-1 text-sm text-amber-50">
      {isLearners ? 'Xếp theo số câu đã làm (mỗi lần nộp bài khi đã đăng nhập).' : 'Xếp theo số đề công khai đã tạo, rồi đến tổng lượt ôn.'}
    </p>
  </div>

  <div class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex gap-2 rounded-2xl bg-slate-100 p-1">
      {#each KIND_TABS as t (t.key)}
        <a href={hrefWith(t.key, data.period)} class={tab(data.kind === t.key)}><t.icon size={14} /> <span class="sm:hidden">{t.short}</span><span class="hidden sm:inline">{t.label}</span></a>
      {/each}
    </div>
    <div class="flex gap-2">
      {#each PERIOD_TABS as p (p.key)}
        <a href={hrefWith(data.kind, p.key)} class={pill(data.period === p.key)}>{p.label}</a>
      {/each}
    </div>
  </div>

  {#if data.unavailable}
    <p class="rounded-2xl px-5 py-4 text-sm" style="background:#fffbeb;color:#b45309;">
      Bảng xếp hạng chưa sẵn sàng: database chưa được cập nhật (migration 007).
    </p>
  {:else if data.rows.length === 0}
    <div class="rounded-[2rem] border-4 border-dashed border-slate-200 py-16 text-center text-sm" style="color:#94a3b8;">
      Chưa có ai trong bảng xếp hạng {data.period === 'tat-ca' ? '' : 'của khoảng thời gian này'}.
      {isLearners ? 'Đăng nhập và ôn một đề để ghi tên!' : 'Tạo một đề công khai để ghi tên!'}
    </div>
  {:else}
    {#if data.myId && !myRow}
      <p class="px-1 text-xs" style="color:#94a3b8;">Bạn chưa có tên trong top {data.rows.length} — {isLearners ? 'ôn thêm vài đề nhé!' : 'chia sẻ thêm đề công khai nhé!'}</p>
    {/if}
    <ol class="overflow-hidden rounded-[2rem] border shadow-sm" style="background:#ffffff;border-color:#f1f5f9;">
      {#each data.rows as row (row.user_id)}
        {@const mine = row.user_id === data.myId}
        <li class="flex items-center gap-3 border-b px-5 py-3 last:border-b-0"
          style="border-color:#f1f5f9;background:{mine ? '#eef2ff' : 'transparent'};">
          <span class="w-8 shrink-0 text-center text-sm font-black" style="color:{row.rank <= 3 ? '#b45309' : '#94a3b8'};">
            {medal(row.rank) ?? row.rank}
          </span>
          {#if row.avatar_url}
            <img src={row.avatar_url} alt="" class="h-9 w-9 shrink-0 rounded-full object-cover" referrerpolicy="no-referrer" />
          {:else}
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black" style="background:#eef2ff;color:#4338ca;">
              {row.display_name[0]?.toUpperCase()}
            </span>
          {/if}
          <span class="min-w-0 flex-1 truncate text-sm font-bold" style="color:#0f172a;">
            {row.display_name}{#if mine}<span class="ml-1.5 text-xs font-black" style="color:#4f46e5;">(bạn)</span>{/if}
          </span>
          <span class="shrink-0 text-right">
            <span class="block text-sm font-black" style="color:#4338ca;">
              {row.score.toLocaleString('vi-VN')} {isLearners ? 'câu' : 'đề'}
            </span>
            <span class="block text-[11px]" style="color:#94a3b8;">
              {row.extra.toLocaleString('vi-VN')} {isLearners ? 'lượt làm bài' : 'lượt ôn'}
            </span>
          </span>
        </li>
      {/each}
    </ol>
  {/if}
</div>
