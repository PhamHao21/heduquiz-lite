<!-- src/routes/lich-su/+page.svelte -->
<script lang="ts">
  import { History, ChevronRight, ArrowLeft, ArrowRight, Compass } from 'lucide-svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import { coverStyle, initials } from '$lib/utils/cover';
  import { dayKey } from '$lib/utils/activity';
  import { formatDuration } from '$lib/utils/stats';

  const { data } = $props();
  const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.pageSize)));

  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86_400_000));
  function dayLabel(key: string) {
    if (key === today) return 'Hôm nay';
    if (key === yesterday) return 'Hôm qua';
    return new Date(`${key}T00:00:00Z`).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }
  const groups = $derived.by(() => {
    const out: { key: string; rows: typeof data.rows }[] = [];
    for (const r of data.rows) {
      const key = dayKey(new Date(r.completed_at));
      const last = out[out.length - 1];
      if (last?.key === key) last.rows.push(r);
      else out.push({ key, rows: [r] });
    }
    return out;
  });
  const time = (iso: string) => new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
  const tone = (p: number) => (p >= 0.8 ? 'bg-success-soft text-success' : p >= 0.5 ? 'bg-warning-soft text-warning' : 'bg-danger-soft text-danger');
</script>

<svelte:head><title>Lịch sử làm bài · HeduQuiz</title></svelte:head>

<div class="mx-auto max-w-3xl space-y-6">
  <div>
    <h1 class="flex items-center gap-2.5 text-3xl font-extrabold tracking-tight"><History size={28} class="text-accent" /> Lịch sử làm bài</h1>
    <p class="mt-1.5 text-muted">{data.total.toLocaleString('vi-VN')} lượt làm bài. Bấm vào một lượt để xem lại từng câu.</p>
  </div>

  {#if data.rows.length === 0}
    <EmptyState icon={History} title="Chưa có lượt làm bài nào" description="Khi đã đăng nhập, mỗi lần nộp bài sẽ được lưu ở đây.">
      <a href="/kham-pha" class="btn btn-primary"><Compass size={16} /> Tìm đề để ôn</a>
    </EmptyState>
  {:else}
    {#each groups as g (g.key)}
      <section>
        <h2 class="mb-2 px-1 text-sm font-semibold capitalize text-muted">{dayLabel(g.key)}</h2>
        <ul class="card divide-y divide-line overflow-hidden">
          {#each g.rows as r (r.id)}
            {@const p = r.total ? r.score / r.total : 0}
            <li>
              <a href="/lich-su/{r.id}" class="flex items-center gap-3 px-4 py-3 transition hover:bg-sunken">
                <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white/90" style={coverStyle(r.quiz_id)} aria-hidden="true">
                  {initials(r.quiz?.title ?? '?')}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate font-semibold">{r.quiz?.title ?? 'Đề không còn truy cập được'}</span>
                  <span class="block text-xs text-muted">{time(r.completed_at)}{r.time_spent ? ` · ${formatDuration(r.time_spent)}` : ''}{r.quiz?.subject ? ` · ${r.quiz.subject}` : ''}</span>
                </span>
                <span class="shrink-0 text-right">
                  <span class="block font-bold tabular-nums">{r.score}/{r.total}</span>
                  <span class="rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums {tone(p)}">{Math.round(p * 100)}%</span>
                </span>
                <ChevronRight size={18} class="shrink-0 text-faint" />
              </a>
            </li>
          {/each}
        </ul>
      </section>
    {/each}

    {#if totalPages > 1}
      <nav class="flex items-center justify-center gap-3" aria-label="Phân trang">
        {#if data.page > 1}<a href="/lich-su?trang={data.page - 1}" class="btn btn-secondary btn-sm"><ArrowLeft size={15} /> Mới hơn</a>{/if}
        <span class="text-sm text-muted">Trang {data.page} / {totalPages}</span>
        {#if data.page < totalPages}<a href="/lich-su?trang={data.page + 1}" class="btn btn-secondary btn-sm">Cũ hơn <ArrowRight size={15} /></a>{/if}
      </nav>
    {/if}
  {/if}
</div>
