<!-- src/routes/tim-kiem/+page.svelte -->
<script lang="ts">
  import { Search, FileText, Users, Bookmark, ArrowRight, ChevronLeft, ChevronRight, Lock } from 'lucide-svelte';
  import QuizTile from '$lib/components/quiz/QuizTile.svelte';
  import { coverStyle, initials } from '$lib/utils/cover';
  import CollectionCard from '$lib/components/collections/CollectionCard.svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import FollowButton from '$lib/components/social/FollowButton.svelte';
  import { compactNumber } from '$lib/utils/time';

  const { data } = $props();
  const liked = $derived(new Set(data.liked));
  const followed = $derived(new Set(data.followed));
  // Ô nhập theo URL, vẫn sửa được trước khi bấm tìm
  let query = $derived(data.q);

  const tabs = [
    { key: 'tat-ca', label: 'Tất cả' },
    { key: 'de', label: 'Đề' },
    { key: 'nguoi-dung', label: 'Người dùng' },
    { key: 'bo-suu-tap', label: 'Bộ sưu tập' }
  ] as const;
  const href = (tab: string, page = 1) => {
    const p = new URLSearchParams({ q: data.q });
    if (tab !== 'tat-ca') p.set('loai', tab);
    if (page > 1) p.set('trang', String(page));
    return `/tim-kiem?${p}`;
  };
  const nothing = $derived(data.q && data.quizzes.length + data.mine.length + data.people.length + data.collections.length === 0);
  const pages = $derived(Math.max(1, Math.ceil(data.quizTotal / data.pageSize)));
  const SUGGEST = ['Sinh học', 'Lịch sử', 'Tiếng Anh', 'Hoá học', 'Toán', 'Địa lý'];
</script>

<svelte:head><title>{data.q ? `"${data.q}" · Tìm kiếm` : 'Tìm kiếm'} · HeduQuiz</title></svelte:head>

<div class="space-y-6">
  <form method="GET" action="/tim-kiem" class="card flex items-center gap-2 p-2 pl-4" role="search">
    <Search size={18} class="shrink-0 text-muted" />
    <label for="search-page-input" class="sr-only">Tìm đề, người dùng, bộ sưu tập</label>
    <input id="search-page-input" name="q" type="search" bind:value={query} autocomplete="off"
      class="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-faint" placeholder="Tìm đề, người dùng, bộ sưu tập..." />
    {#if data.tab !== 'tat-ca'}<input type="hidden" name="loai" value={data.tab} />{/if}
    <button class="btn btn-primary">Tìm</button>
  </form>

  {#if !data.q}
    <div class="card p-6 sm:p-8">
      <h1 class="text-2xl font-extrabold tracking-tight">Bạn muốn ôn gì hôm nay?</h1>
      <p class="mt-1 text-muted">Tìm theo tên đề, môn học, tên tác giả hoặc bộ sưu tập. Gõ không dấu cũng được.</p>
      <div class="mt-5 flex flex-wrap gap-2">
        {#each SUGGEST as s (s)}<a href="/tim-kiem?q={encodeURIComponent(s)}" class="chip">{s}</a>{/each}
      </div>
      <p class="mt-6 hidden text-sm text-muted sm:block">
        Mẹo: nhấn <kbd class="rounded-md border border-line bg-sunken px-1.5 py-0.5 font-mono text-xs">Ctrl</kbd> + <kbd class="rounded-md border border-line bg-sunken px-1.5 py-0.5 font-mono text-xs">K</kbd> ở bất kỳ trang nào để mở tìm kiếm nhanh.
      </p>
    </div>
  {:else}
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-bold">Kết quả cho <span class="text-accent">"{data.q}"</span></h1>
      <nav class="segmented" aria-label="Loại kết quả">
        {#each tabs as t (t.key)}
          <a href={href(t.key)} aria-current={data.tab === t.key ? 'true' : undefined} data-sveltekit-noscroll>{t.label}</a>
        {/each}
      </nav>
    </div>

    {#if nothing}
      <EmptyState icon={Search} title="Không tìm thấy kết quả nào" description="Thử từ khoá ngắn hơn, bỏ bớt từ, hoặc tìm trong Khám phá theo môn học.">
        <a href="/kham-pha" class="btn btn-secondary">Mở Khám phá</a>
      </EmptyState>
    {/if}

    {#if data.mine.length > 0}
      <section aria-labelledby="r-mine">
        <h2 id="r-mine" class="mb-3 flex items-center gap-2 text-base font-bold"><Lock size={16} class="text-muted" /> Đề của tôi</h2>
        <ul class="card divide-y divide-line overflow-hidden">
          {#each data.mine as quiz (quiz.id)}
            <li>
              <a href="/quiz/{quiz.id}" class="flex items-center gap-3 px-4 py-3 transition hover:bg-sunken">
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold text-white/90" style={coverStyle(quiz.id)} aria-hidden="true">{initials(quiz.title)}</span>
                <span class="min-w-0 flex-1 truncate font-semibold">{quiz.title}</span>
                {#if quiz.question_count != null}<span class="text-xs text-muted">{quiz.question_count} câu</span>{/if}
              </a>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if data.quizzes.length > 0}
      <section aria-labelledby="r-quizzes">
        <div class="mb-3 flex items-center justify-between">
          <h2 id="r-quizzes" class="flex items-center gap-2 text-base font-bold"><FileText size={16} class="text-muted" /> Đề công khai <span class="font-medium text-faint">{data.quizTotal}</span></h2>
          {#if data.tab === 'tat-ca' && data.quizTotal > data.quizzes.length}
            <a href={href('de')} class="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">Xem tất cả <ArrowRight size={14} /></a>
          {/if}
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {#each data.quizzes as quiz (quiz.id)}<QuizTile {quiz} liked={liked.has(quiz.id)} />{/each}
        </div>
        {#if data.tab === 'de' && pages > 1}
          <nav class="mt-6 flex items-center justify-center gap-2" aria-label="Phân trang">
            {#if data.page > 1}<a class="btn btn-secondary btn-sm" href={href('de', data.page - 1)}><ChevronLeft size={15} /> Trước</a>{/if}
            <span class="px-2 text-sm text-muted">Trang {data.page} / {pages}</span>
            {#if data.page < pages}<a class="btn btn-secondary btn-sm" href={href('de', data.page + 1)}>Sau <ChevronRight size={15} /></a>{/if}
          </nav>
        {/if}
      </section>
    {/if}

    {#if data.people.length > 0}
      <section aria-labelledby="r-people">
        <div class="mb-3 flex items-center justify-between">
          <h2 id="r-people" class="flex items-center gap-2 text-base font-bold"><Users size={16} class="text-muted" /> Người dùng</h2>
          {#if data.tab === 'tat-ca' && data.people.length >= 6}
            <a href={href('nguoi-dung')} class="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">Xem thêm <ArrowRight size={14} /></a>
          {/if}
        </div>
        <ul class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {#each data.people as person (person.id)}
            <li class="card flex items-center gap-3 p-4">
              <a href="/u/{person.username}"><Avatar name={person.display_name ?? person.username} src={person.avatar_url} size={44} /></a>
              <a href="/u/{person.username}" class="min-w-0 flex-1">
                <span class="block truncate font-semibold hover:underline">{person.display_name ?? person.username}</span>
                <span class="block truncate text-xs text-muted">@{person.username} · {compactNumber(person.follower_count ?? 0)} người theo dõi</span>
              </a>
              {#if person.id !== data.meId}<FollowButton userId={person.id} following={followed.has(person.id)} size="sm" />{/if}
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if data.collections.length > 0}
      <section aria-labelledby="r-collections">
        <div class="mb-3 flex items-center justify-between">
          <h2 id="r-collections" class="flex items-center gap-2 text-base font-bold"><Bookmark size={16} class="text-muted" /> Bộ sưu tập</h2>
          {#if data.tab === 'tat-ca' && data.collections.length >= 4}
            <a href={href('bo-suu-tap')} class="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">Xem thêm <ArrowRight size={14} /></a>
          {/if}
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {#each data.collections as c (c.id)}
            <CollectionCard collection={{
              id: c.id, title: c.title, description: c.description, count: c.item_count, quizIds: [],
              owner: c.owner_username ? { username: c.owner_username, display_name: c.owner_name, avatar_url: c.owner_avatar } : null
            }} />
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>
