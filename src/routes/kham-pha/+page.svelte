<!-- src/routes/kham-pha/+page.svelte -->
<script lang="ts">
  import { Compass, Search, BookOpen, ListChecks, Flame, Sparkles } from 'lucide-svelte';

  const { data } = $props();

  const totalPages = $derived(Math.max(1, Math.ceil(Number(data.total) / data.pageSize)));

  /** Link giữ nguyên các bộ lọc hiện tại, chỉ đổi những tham số truyền vào. */
  function hrefWith(changes: Record<string, string | number | null>) {
    const params = new URLSearchParams();
    const current: Record<string, string | number | null> = {
      q: data.q || null,
      mon: data.subject || null,
      sort: data.sort === 'new' ? 'new' : null,
      trang: null,
      ...changes
    };
    for (const [k, v] of Object.entries(current)) {
      if (v !== null && v !== '' && !(k === 'trang' && Number(v) <= 1)) params.set(k, String(v));
    }
    const qs = params.toString();
    return qs ? `/kham-pha?${qs}` : '/kham-pha';
  }

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-bold transition ${active ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200'}`;
</script>

<svelte:head>
  <title>Khám phá đề thi — HeduQuiz</title>
  <meta name="description" content="Kho đề trắc nghiệm công khai trên HeduQuiz: tìm và ôn thi miễn phí, không cần đăng nhập." />
</svelte:head>

<div class="mx-auto max-w-5xl space-y-6" style="color:#1e293b;">
  <div class="rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-violet-700 p-7 text-white shadow-xl shadow-indigo-100">
    <h1 class="flex items-center gap-2 text-2xl font-black uppercase tracking-tight"><Compass size={24} /> Khám phá đề thi</h1>
    <p class="mt-1 text-sm text-indigo-100">Đề công khai do mọi người tạo — ôn ngay, không cần đăng nhập.</p>

    <form method="GET" action="/kham-pha" class="mt-5 flex gap-2" data-sveltekit-keepfocus>
      {#if data.subject}<input type="hidden" name="mon" value={data.subject} />{/if}
      {#if data.sort === 'new'}<input type="hidden" name="sort" value="new" />{/if}
      <div class="relative min-w-0 flex-1">
        <Search size={16} class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          name="q"
          value={data.q}
          placeholder="Tìm theo tên đề, môn… (gõ không dấu cũng được)"
          class="w-full rounded-2xl border-0 py-3 pl-10 pr-4 text-sm font-medium outline-none"
          style="background:#ffffff;color:#1e293b;"
        />
      </div>
      <button class="shrink-0 rounded-2xl bg-white/15 px-5 py-3 text-sm font-black uppercase tracking-wider text-white hover:bg-white/25">
        Tìm
      </button>
    </form>
  </div>

  <!-- Bộ lọc -->
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex flex-wrap gap-2">
      <a href={hrefWith({ mon: null })} class={chip(!data.subject)}>Tất cả</a>
      {#each data.subjects as s (s)}
        <a href={hrefWith({ mon: s })} class={chip(data.subject === s)}>{s}</a>
      {/each}
    </div>
    <div class="flex gap-2">
      <a href={hrefWith({ sort: null })} class="{chip(data.sort !== 'new')} inline-flex items-center gap-1"><Flame size={13} /> Phổ biến</a>
      <a href={hrefWith({ sort: 'new' })} class="{chip(data.sort === 'new')} inline-flex items-center gap-1"><Sparkles size={13} /> Mới nhất</a>
    </div>
  </div>

  {#if data.unavailable}
    <p class="rounded-2xl px-5 py-4 text-sm" style="background:#fffbeb;color:#b45309;">
      Trang Khám phá chưa sẵn sàng: database chưa được cập nhật (migration 007).
    </p>
  {:else if data.quizzes.length === 0}
    <div class="rounded-[2rem] border-4 border-dashed border-slate-200 py-16 text-center" style="color:#94a3b8;">
      {#if data.q || data.subject}
        Không tìm thấy đề nào{data.q ? ` khớp với "${data.q}"` : ''}{data.subject ? ` trong mục ${data.subject}` : ''}.
        <a href="/kham-pha" class="ml-1 font-bold text-indigo-600 hover:underline">Xem tất cả</a>
      {:else}
        Chưa có đề công khai nào. Hãy là người đầu tiên chia sẻ đề của bạn!
      {/if}
    </div>
  {:else}
    <p class="px-1 text-xs font-bold" style="color:#94a3b8;">{data.total} đề{data.q ? ` cho "${data.q}"` : ''}</p>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each data.quizzes as quiz (quiz.id)}
        <a href="/quiz/{quiz.id}"
          class="group flex flex-col rounded-[2rem] border p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
          style="background:#ffffff;border-color:#f1f5f9;">
          {#if quiz.subject}
            <span class="mb-3 self-start rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide" style="background:#eef2ff;color:#4338ca;">
              {quiz.subject}
            </span>
          {/if}
          <h2 class="line-clamp-2 flex-1 text-base font-black leading-snug" style="color:#0f172a;">{quiz.title}</h2>
          <p class="mt-3 flex items-center gap-3 text-[11px] font-bold" style="color:#94a3b8;">
            <span class="flex items-center gap-1"><ListChecks size={12} /> {quiz.question_count} câu</span>
            <span class="flex items-center gap-1"><BookOpen size={12} /> {quiz.play_count} lượt ôn</span>
          </p>
          <div class="mt-3 flex items-center gap-2 border-t pt-3" style="border-color:#f1f5f9;">
            {#if quiz.owner_avatar}
              <img src={quiz.owner_avatar} alt="" class="h-6 w-6 rounded-full object-cover" referrerpolicy="no-referrer" />
            {:else}
              <span class="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black" style="background:#eef2ff;color:#4338ca;">
                {quiz.owner_name[0]?.toUpperCase()}
              </span>
            {/if}
            <span class="truncate text-xs font-bold" style="color:#64748b;">{quiz.owner_name}</span>
            <span class="ml-auto shrink-0 text-[10px] font-black uppercase tracking-widest text-indigo-600 opacity-0 transition group-hover:opacity-100">Ôn ngay →</span>
          </div>
        </a>
      {/each}
    </div>

    {#if totalPages > 1}
      <nav class="flex items-center justify-center gap-3 pt-2" aria-label="Phân trang">
        {#if data.page > 1}
          <a href={hrefWith({ trang: data.page - 1 })} class={chip(false)}>← Trước</a>
        {/if}
        <span class="text-xs font-bold" style="color:#64748b;">Trang {data.page} / {totalPages}</span>
        {#if data.page < totalPages}
          <a href={hrefWith({ trang: data.page + 1 })} class={chip(false)}>Sau →</a>
        {/if}
      </nav>
    {/if}
  {/if}
</div>
