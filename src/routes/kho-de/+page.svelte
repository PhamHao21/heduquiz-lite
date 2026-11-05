<!-- src/routes/kho-de/+page.svelte -->
<script lang="ts">
  import {
    FileText, Users, Repeat, Flame, Search, Plus, Globe, Lock, Pencil, Trash2, Compass, ArrowRight, History, Play
  } from 'lucide-svelte';
  import { page } from '$app/state';
  import { invalidateAll } from '$app/navigation';
  import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ActivityHeatmap from '$lib/components/dashboard/ActivityHeatmap.svelte';
  import { toast } from '$lib/stores/toast.svelte';

  const { data } = $props();

  interface Quiz {
    id: string; title: string; subject: string | null;
    is_public: boolean; play_count: number;
    created_at: string; updated_at: string;
  }

  const quizzes = $derived(data.quizzes as Quiz[]);
  const progressById = $derived(new Map(data.progress.map(p => [p.quiz_id, p])));
  const toReview = $derived(data.progress.filter(p => p.needs_review > 0).slice(0, 5));
  const othersStudied = $derived(data.progress.filter(p => !p.is_owner).slice(0, 5));
  const name = $derived(page.data.profile?.display_name ?? page.data.profile?.username ?? 'bạn');

  type Visibility = 'all' | 'public' | 'private';
  type Sort = 'updated' | 'title' | 'plays';
  let search = $state('');
  let visibility = $state<Visibility>('all');
  let sort = $state<Sort>('updated');

  const filtered = $derived.by(() => {
    const q = search.trim().toLowerCase();
    const list = quizzes.filter(item =>
      (visibility === 'all' || (visibility === 'public') === item.is_public) &&
      (!q || item.title.toLowerCase().includes(q) || (item.subject ?? '').toLowerCase().includes(q))
    );
    if (sort === 'title') return [...list].sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    if (sort === 'plays') return [...list].sort((a, b) => b.play_count - a.play_count);
    return list;
  });

  let deleteTarget = $state<Quiz | null>(null);
  let deleting = $state(false);

  async function callApi(method: 'PATCH' | 'DELETE', body: Record<string, unknown>) {
    const res = await fetch('/api/quizzes', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const msg = (await res.json().catch(() => null))?.message;
      throw new Error(msg ?? `Lỗi ${res.status}`);
    }
  }

  async function togglePublic(q: Quiz) {
    try {
      await callApi('PATCH', { id: q.id, is_public: !q.is_public });
      toast.success(q.is_public ? `"${q.title}" đã chuyển sang riêng tư` : `"${q.title}" đã công khai`);
    } catch (e) {
      toast.error(`Không đổi được chế độ hiển thị: ${e instanceof Error ? e.message : e}`);
    }
    await invalidateAll();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    deleting = true;
    try {
      await callApi('DELETE', { id: deleteTarget.id });
      toast.success(`Đã xoá "${deleteTarget.title}"`);
    } catch (e) {
      toast.error(`Không xoá được đề: ${e instanceof Error ? e.message : e}`);
    }
    deleting = false;
    deleteTarget = null;
    await invalidateAll();
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN');
  const greeting = (() => {
    const h = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()));
    return h < 11 ? 'Chào buổi sáng' : h < 14 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  })();
</script>

<svelte:head><title>Kho đề · HeduQuiz</title></svelte:head>

<ConfirmModal
  open={deleteTarget !== null}
  title="Xoá đề thi?"
  message={deleteTarget ? `Bạn sắp xoá "${deleteTarget.title}". Toàn bộ câu hỏi và lịch sử ôn thi của đề sẽ bị xoá vĩnh viễn.` : ''}
  confirmLabel="Xoá vĩnh viễn"
  danger
  loading={deleting}
  onConfirm={confirmDelete}
  onCancel={() => { deleteTarget = null; }}
/>

<div class="space-y-8">
  <!-- Lời chào + thống kê -->
  <section class="rise-in">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-muted">{greeting},</p>
        <h1 class="text-2xl font-extrabold tracking-tight sm:text-3xl">{name}</h1>
      </div>
    </div>

    <div class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div class="card p-4">
        <FileText size={18} class="text-muted" />
        <p class="mt-3 text-2xl font-extrabold tabular-nums">{data.stats.totalQuizzes}</p>
        <p class="text-xs font-medium text-muted">Đề của bạn</p>
      </div>
      <div class="card p-4">
        <Users size={18} class="text-muted" />
        <p class="mt-3 text-2xl font-extrabold tabular-nums">{data.stats.totalAttempts}</p>
        <p class="text-xs font-medium text-muted">Lượt đã ôn</p>
      </div>
      <div class="card p-4">
        <Repeat size={18} class={data.stats.needsReview > 0 ? 'text-warning' : 'text-muted'} />
        <p class="mt-3 text-2xl font-extrabold tabular-nums">{data.stats.needsReview}</p>
        <p class="text-xs font-medium text-muted">Câu cần ôn lại</p>
      </div>
      <div class="card p-4">
        <Flame size={18} class={data.activity.streak > 0 ? 'text-[#f26a1b]' : 'text-muted'} />
        <p class="mt-3 text-2xl font-extrabold tabular-nums">{data.activity.streak} <span class="text-sm font-semibold text-muted">ngày</span></p>
        <p class="text-xs font-medium text-muted">Chuỗi ngày ôn</p>
      </div>
    </div>
  </section>

  <div class="grid gap-8 lg:grid-cols-[1fr_300px]">
    <!-- Đề của bạn -->
    <section class="min-w-0 space-y-4">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="mr-auto text-lg font-bold">Đề của bạn</h2>
        <div class="segmented" role="group" aria-label="Lọc theo chế độ hiển thị">
          <button aria-pressed={visibility === 'all'} onclick={() => { visibility = 'all'; }}>Tất cả</button>
          <button aria-pressed={visibility === 'public'} onclick={() => { visibility = 'public'; }}>Công khai</button>
          <button aria-pressed={visibility === 'private'} onclick={() => { visibility = 'private'; }}>Riêng tư</button>
        </div>
      </div>

      {#if quizzes.length > 0}
        <div class="flex gap-2">
          <label class="relative min-w-0 flex-1">
            <span class="sr-only">Tìm đề</span>
            <Search size={16} class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input type="search" bind:value={search} placeholder="Tìm theo tên hoặc trình độ" class="input pl-10" />
          </label>
          <label>
            <span class="sr-only">Sắp xếp</span>
            <select bind:value={sort} class="input w-auto pr-8">
              <option value="updated">Mới cập nhật</option>
              <option value="title">Tên A-Z</option>
              <option value="plays">Nhiều lượt ôn</option>
            </select>
          </label>
        </div>
      {/if}

      {#if quizzes.length === 0}
        <EmptyState icon={FileText} title="Bạn chưa có đề nào" description="Dán đề có sẵn hoặc nhập từ file Word, PDF để bắt đầu ôn.">
          <div class="flex flex-wrap justify-center gap-2">
            <a href="/tao-de" class="btn btn-primary"><Plus size={16} /> Tạo đề đầu tiên</a>
            <a href="/kham-pha" class="btn btn-secondary"><Compass size={16} /> Khám phá đề công khai</a>
          </div>
        </EmptyState>
      {:else if filtered.length === 0}
        <p class="rounded-2xl border border-dashed border-line-strong py-10 text-center text-sm text-muted">
          Không có đề nào khớp bộ lọc.
        </p>
      {:else}
        <div class="grid gap-3 sm:grid-cols-2">
          {#each filtered as q (q.id)}
            {@const prog = progressById.get(q.id)}
            <article class="card card-hover flex flex-col p-5">
              <div class="flex items-center gap-2">
                {#if q.subject}<span class="tag">{q.subject}</span>{/if}
                <button
                  onclick={() => togglePublic(q)}
                  class="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition {q.is_public ? 'bg-success-soft text-success' : 'bg-sunken text-muted hover:text-ink'}"
                  title={q.is_public ? 'Đang công khai, bấm để chuyển sang riêng tư' : 'Đang riêng tư, bấm để công khai'}
                >
                  {#if q.is_public}<Globe size={12} /> Công khai{:else}<Lock size={12} /> Riêng tư{/if}
                </button>
              </div>

              <a href="/quiz/{q.id}" class="mt-3 line-clamp-2 flex-1 text-[15px] font-bold leading-snug hover:text-accent">{q.title}</a>

              <p class="mt-3 text-xs text-muted">
                Cập nhật {formatDate(q.updated_at)} · {q.play_count} lượt ôn
              </p>
              <p class="mt-1.5 min-h-5 text-xs font-semibold">
                {#if prog && prog.needs_review > 0}
                  <span class="inline-flex items-center gap-1 text-warning"><Repeat size={12} /> {prog.needs_review} câu cần ôn lại</span>
                {:else if prog}
                  <span class="text-success">Lần gần nhất {prog.last_score}/{prog.last_total} câu đúng</span>
                {/if}
              </p>

              <div class="mt-4 flex gap-2">
                <a href="/quiz/{q.id}" class="btn btn-primary btn-sm flex-1"><Play size={14} /> Ôn thi</a>
                <a href="/tao-de?edit={q.id}" class="btn btn-secondary btn-sm btn-icon" title="Sửa đề" aria-label="Sửa đề {q.title}"><Pencil size={15} /></a>
                <button onclick={() => { deleteTarget = q; }} class="btn btn-secondary btn-sm btn-icon hover:border-danger hover:text-danger" title="Xoá đề" aria-label="Xoá đề {q.title}"><Trash2 size={15} /></button>
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </section>

    <!-- Cột phụ -->
    <aside class="space-y-4">
      <div class="card p-5">
        <div class="flex items-baseline justify-between">
          <h2 class="font-bold">Hoạt động</h2>
          <span class="text-xs text-muted">{data.activity.activeDays} ngày có ôn</span>
        </div>
        <div class="mt-4 overflow-x-auto"><ActivityHeatmap days={data.activity.days} /></div>
        <p class="mt-3 text-xs text-muted">
          {#if data.activity.today > 0}
            Hôm nay bạn đã ôn {data.activity.today} lượt. Chuỗi dài nhất: {data.activity.bestStreak} ngày.
          {:else if data.activity.streak > 0}
            Ôn một đề hôm nay để giữ chuỗi {data.activity.streak} ngày.
          {:else}
            Ôn mỗi ngày một ít để bắt đầu chuỗi ngày học.
          {/if}
        </p>
      </div>

      {#if toReview.length > 0}
        <div class="card p-5">
          <h2 class="flex items-center gap-2 font-bold"><Repeat size={16} class="text-warning" /> Cần ôn lại</h2>
          <ul class="mt-3 space-y-1">
            {#each toReview as p (p.quiz_id)}
              <li>
                <a href="/quiz/{p.quiz_id}" class="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-sunken">
                  <span class="min-w-0 flex-1 truncate text-sm font-medium">{p.title}</span>
                  <span class="shrink-0 rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-bold text-warning">{p.needs_review}</span>
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if othersStudied.length > 0}
        <div class="card p-5">
          <h2 class="flex items-center gap-2 font-bold"><History size={16} class="text-muted" /> Đề đã ôn gần đây</h2>
          <ul class="mt-3 space-y-1">
            {#each othersStudied as p (p.quiz_id)}
              <li>
                <a href="/quiz/{p.quiz_id}" class="block rounded-xl px-2 py-2 hover:bg-sunken">
                  <span class="block truncate text-sm font-medium">{p.title}</span>
                  <span class="text-xs text-muted">Lần gần nhất {p.last_score}/{p.last_total} · {formatDate(p.last_attempt_at)}</span>
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      <a href="/kham-pha" class="card card-hover flex items-center gap-3 p-5">
        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent"><Compass size={20} /></span>
        <span class="flex-1">
          <span class="block text-sm font-bold">Khám phá đề công khai</span>
          <span class="text-xs text-muted">Đề do mọi người chia sẻ</span>
        </span>
        <ArrowRight size={16} class="text-faint" />
      </a>
    </aside>
  </div>
</div>
