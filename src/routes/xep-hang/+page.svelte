<!-- src/routes/xep-hang/+page.svelte -->
<script lang="ts">
  import { Trophy, Flame, PenLine, Medal } from 'lucide-svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';

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
  const podium = ['text-[#c99a06]', 'text-[#8a94a3]', 'text-[#b4682e]'];
</script>

<svelte:head>
  <title>Bảng xếp hạng · HeduQuiz</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
  <section class="rise-in">
    <h1 class="flex items-center gap-2.5 text-3xl font-extrabold tracking-tight"><Trophy size={28} class="text-accent" /> Bảng xếp hạng</h1>
    <p class="mt-1.5 text-muted">
      {isLearners ? 'Xếp theo số câu đã làm (mỗi lần nộp bài khi đã đăng nhập).' : 'Xếp theo số đề công khai đã tạo, sau đó đến tổng lượt ôn.'}
    </p>
  </section>

  <div class="flex flex-wrap items-center justify-between gap-3">
    <div class="segmented" role="group" aria-label="Loại bảng xếp hạng">
      {#each KIND_TABS as t (t.key)}
        <a href={hrefWith(t.key, data.period)} aria-current={data.kind === t.key ? 'true' : undefined}>
          <t.icon size={14} /> <span class="sm:hidden">{t.short}</span><span class="hidden sm:inline">{t.label}</span>
        </a>
      {/each}
    </div>
    <div class="flex gap-2">
      {#each PERIOD_TABS as p (p.key)}
        <a href={hrefWith(data.kind, p.key)} class="chip {data.period === p.key ? 'chip-active' : ''}" aria-current={data.period === p.key ? 'true' : undefined}>{p.label}</a>
      {/each}
    </div>
  </div>

  {#if data.unavailable}
    <p class="rounded-xl bg-warning-soft px-5 py-4 text-sm text-warning">
      Bảng xếp hạng chưa sẵn sàng: database chưa được cập nhật (migration 007).
    </p>
  {:else if data.rows.length === 0}
    <EmptyState icon={Trophy} title="Chưa có ai trong bảng xếp hạng"
      description={isLearners ? 'Đăng nhập và ôn một đề để ghi tên.' : 'Tạo một đề công khai để ghi tên.'} />
  {:else}
    {#if data.myId && !myRow}
      <p class="text-sm text-muted">Bạn chưa có tên trong top {data.rows.length}. {isLearners ? 'Ôn thêm vài đề nhé!' : 'Chia sẻ thêm đề công khai nhé!'}</p>
    {/if}
    <ol class="card divide-y divide-line overflow-hidden">
      {#each data.rows as row (row.user_id)}
        {@const mine = row.user_id === data.myId}
        <li>
          <a href="/u/{row.username}" class="flex items-center gap-3 px-5 py-3.5 transition hover:bg-sunken {mine ? 'bg-accent-soft hover:bg-accent-soft' : ''}">
            <span class="flex w-8 shrink-0 justify-center text-sm font-bold tabular-nums text-faint">
              {#if row.rank <= 3}<Medal size={20} class={podium[row.rank - 1]} />{:else}{row.rank}{/if}
            </span>
            <Avatar name={row.display_name} src={row.avatar_url} size={36} />
            <span class="min-w-0 flex-1 truncate font-semibold">
              {row.display_name}{#if mine}<span class="ml-1.5 text-xs font-bold text-accent">(bạn)</span>{/if}
            </span>
            <span class="shrink-0 text-right">
              <span class="block font-bold tabular-nums">{row.score.toLocaleString('vi-VN')} {isLearners ? 'câu' : 'đề'}</span>
              <span class="block text-xs text-muted">{row.extra.toLocaleString('vi-VN')} {isLearners ? 'lượt làm bài' : 'lượt ôn'}</span>
            </span>
          </a>
        </li>
      {/each}
    </ol>
  {/if}
</div>
