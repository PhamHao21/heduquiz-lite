<!-- src/routes/bang-tin/+page.svelte -->
<script lang="ts">
  import { Newspaper, Compass, Sparkles } from 'lucide-svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import QuizCover from '$lib/components/quiz/QuizCover.svelte';
  import LikeButton from '$lib/components/social/LikeButton.svelte';
  import AuthorCard from '$lib/components/social/AuthorCard.svelte';
  import { timeAgo } from '$lib/utils/time';

  const { data } = $props();
  const liked = $derived(new Set(data.liked));
</script>

<svelte:head><title>Bảng tin · HeduQuiz</title></svelte:head>

<div class="grid gap-8 lg:grid-cols-[1fr_300px]">
  <section class="min-w-0 space-y-5">
    <div class="rise-in">
      <h1 class="text-3xl font-extrabold tracking-tight">Bảng tin</h1>
      <p class="mt-1.5 text-muted">Đề mới từ những tác giả bạn theo dõi.</p>
    </div>

    {#if data.unavailable}
      <div class="rounded-xl bg-warning-soft px-5 py-4 text-sm text-warning">
        <p>Bảng tin chưa sẵn sàng: database chưa được cập nhật (migration 008).</p>
        {#if data.errorDetail}<p class="mt-1 font-mono text-xs opacity-80">Chi tiết: {data.errorDetail}</p>{/if}
      </div>
    {:else if data.feed.length === 0}
      <EmptyState icon={Newspaper} title="Bảng tin còn trống" description="Theo dõi vài tác giả để thấy đề mới của họ ở đây.">
        <a href="/kham-pha" class="btn btn-primary"><Compass size={16} /> Khám phá đề và tác giả</a>
      </EmptyState>
    {:else}
      <ol class="space-y-4">
        {#each data.feed as item (item.id)}
          <li class="card rise-in overflow-hidden">
            <div class="flex items-center gap-3 px-5 pt-4">
              <a href="/u/{item.owner_username}"><Avatar name={item.owner_name} src={item.owner_avatar} size={38} /></a>
              <div class="min-w-0 flex-1 text-sm">
                <p class="truncate"><a href="/u/{item.owner_username}" class="font-bold hover:underline">{item.owner_name}</a> <span class="text-muted">đăng đề mới</span></p>
                <p class="text-xs text-faint">{timeAgo(item.created_at)}</p>
              </div>
            </div>
            <a href="/quiz/{item.id}" class="mt-4 block">
              <QuizCover id={item.id} title={item.title} subject={item.subject} class="h-32" />
            </a>
            <div class="flex flex-wrap items-center gap-3 px-5 py-4">
              <a href="/quiz/{item.id}" class="min-w-0 flex-1">
                <p class="truncate text-[17px] font-bold hover:text-accent">{item.title}</p>
                <p class="text-xs text-muted">{item.question_count} câu · {item.play_count} lượt ôn</p>
              </a>
              <LikeButton quizId={item.id} count={item.like_count} liked={liked.has(item.id)} variant="chip" />
              <a href="/quiz/{item.id}" class="btn btn-primary btn-sm">Ôn ngay</a>
            </div>
          </li>
        {/each}
      </ol>
    {/if}
  </section>

  <aside class="space-y-4">
    {#if data.suggested.length > 0}
      <h2 class="flex items-center gap-2 font-bold"><Sparkles size={16} class="text-accent" /> Gợi ý theo dõi</h2>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {#each data.suggested as author (author.id)}
          <AuthorCard {author} />
        {/each}
      </div>
    {/if}
  </aside>
</div>
