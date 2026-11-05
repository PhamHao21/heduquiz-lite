<!-- src/routes/kham-pha/+page.svelte -->
<script lang="ts">
  import { Search, Flame, Sparkles, Compass, ArrowLeft, ArrowRight, Heart, Trophy, Users } from 'lucide-svelte';
  import AuthorCard from '$lib/components/social/AuthorCard.svelte';
  import QuizTile from '$lib/components/quiz/QuizTile.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';

  const { data } = $props();

  const totalPages = $derived(Math.max(1, Math.ceil(Number(data.total) / data.pageSize)));
  const liked = $derived(new Set(data.liked));

  /** Link giữ nguyên các bộ lọc hiện tại, chỉ đổi những tham số truyền vào. */
  function hrefWith(changes: Record<string, string | number | null>) {
    const params = new URLSearchParams();
    const current: Record<string, string | number | null> = {
      q: data.q || null,
      mon: data.subject || null,
      sort: data.sort === 'popular' ? null : data.sort,
      trang: null,
      ...changes
    };
    for (const [k, v] of Object.entries(current)) {
      if (v !== null && v !== '' && !(k === 'trang' && Number(v) <= 1)) params.set(k, String(v));
    }
    const qs = params.toString();
    return qs ? `/kham-pha?${qs}` : '/kham-pha';
  }
</script>

<svelte:head>
  <title>Khám phá đề thi · HeduQuiz</title>
  <meta name="description" content="Kho đề trắc nghiệm công khai trên HeduQuiz: tìm và ôn thi miễn phí, không cần đăng nhập." />
</svelte:head>

<div class="space-y-6">
  <section class="rise-in">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <h1 class="text-3xl font-extrabold tracking-tight">Khám phá đề thi</h1>
      <a href="/xep-hang" class="btn btn-ghost btn-sm"><Trophy size={15} /> Bảng xếp hạng</a>
    </div>
    <p class="mt-1.5 text-muted">Đề công khai do mọi người tạo. Ôn ngay, không cần đăng nhập.</p>

    <form method="GET" action="/kham-pha" class="mt-5 flex gap-2" data-sveltekit-keepfocus>
      {#if data.subject}<input type="hidden" name="mon" value={data.subject} />{/if}
      {#if data.sort !== 'popular'}<input type="hidden" name="sort" value={data.sort} />{/if}
      <label class="relative min-w-0 flex-1">
        <span class="sr-only">Tìm đề</span>
        <Search size={18} class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
        <input type="search" name="q" value={data.q} placeholder="Tìm theo tên đề, môn học (gõ không dấu cũng được)" class="input py-3 pl-11 text-[15px]" />
      </label>
      <button class="btn btn-primary btn-lg">Tìm</button>
    </form>
  </section>

  <div class="flex flex-wrap items-center justify-between gap-3">
    <nav class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Lọc theo trình độ">
      <a href={hrefWith({ mon: null })} class="chip shrink-0 {!data.subject ? 'chip-active' : ''}" aria-current={!data.subject ? 'true' : undefined}>Tất cả</a>
      {#each data.subjects as s (s)}
        <a href={hrefWith({ mon: s })} class="chip shrink-0 {data.subject === s ? 'chip-active' : ''}" aria-current={data.subject === s ? 'true' : undefined}>{s}</a>
      {/each}
    </nav>
    <div class="segmented" role="group" aria-label="Sắp xếp">
      <a href={hrefWith({ sort: null })} aria-current={data.sort === 'popular' ? 'true' : undefined}><Flame size={14} /> Phổ biến</a>
      <a href={hrefWith({ sort: 'liked' })} aria-current={data.sort === 'liked' ? 'true' : undefined}><Heart size={14} /> Nhiều tim</a>
      <a href={hrefWith({ sort: 'new' })} aria-current={data.sort === 'new' ? 'true' : undefined}><Sparkles size={14} /> Mới nhất</a>
    </div>
  </div>

  {#if data.authors.length > 0}
    <section>
      <h2 class="mb-3 flex items-center gap-2 font-bold"><Users size={17} class="text-accent" /> Tác giả nổi bật</h2>
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {#each data.authors as author (author.id)}
          <AuthorCard {author} />
        {/each}
      </div>
    </section>
  {/if}

  {#if data.unavailable}
    <p class="rounded-xl bg-warning-soft px-5 py-4 text-sm text-warning">
      Trang Khám phá chưa sẵn sàng: database chưa được cập nhật (migration 007).
    </p>
  {:else if data.quizzes.length === 0}
    {#if data.q || data.subject}
      <EmptyState icon={Search} title="Không tìm thấy đề nào"
        description={`${data.q ? `Không có đề khớp với "${data.q}"` : 'Chưa có đề'}${data.subject ? ` trong mục ${data.subject}` : ''}.`}>
        <a href="/kham-pha" class="btn btn-secondary">Xem tất cả đề</a>
      </EmptyState>
    {:else}
      <EmptyState icon={Compass} title="Chưa có đề công khai nào" description="Hãy là người đầu tiên chia sẻ đề của bạn." />
    {/if}
  {:else}
    <p class="text-sm text-muted">{data.total} đề{data.q ? ` cho "${data.q}"` : ''}</p>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {#each data.quizzes as quiz (quiz.id)}
        <QuizTile {quiz} liked={liked.has(quiz.id)} />
      {/each}
    </div>

    {#if totalPages > 1}
      <nav class="flex items-center justify-center gap-3 pt-4" aria-label="Phân trang">
        {#if data.page > 1}
          <a href={hrefWith({ trang: data.page - 1 })} class="btn btn-secondary btn-sm"><ArrowLeft size={15} /> Trước</a>
        {/if}
        <span class="text-sm font-medium text-muted">Trang {data.page} / {totalPages}</span>
        {#if data.page < totalPages}
          <a href={hrefWith({ trang: data.page + 1 })} class="btn btn-secondary btn-sm">Sau <ArrowRight size={15} /></a>
        {/if}
      </nav>
    {/if}
  {/if}
</div>
