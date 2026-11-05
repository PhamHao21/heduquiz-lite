<!-- src/routes/u/[username]/+page.svelte -->
<script lang="ts">
  import { FileText, Users, CalendarDays, Pencil, Plus } from 'lucide-svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import QuizTile from '$lib/components/quiz/QuizTile.svelte';

  const { data } = $props();
  const p = $derived(data.profile);
  const name = $derived(p.display_name || p.username);
  const joined = $derived(
    new Date(p.created_at).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
  );
</script>

<svelte:head>
  <title>{name} · HeduQuiz</title>
  <meta name="description" content="Các đề trắc nghiệm công khai của {name} trên HeduQuiz." />
</svelte:head>

<div class="space-y-8">
  <section class="card rise-in p-6 sm:p-8">
    <div class="flex flex-col gap-5 sm:flex-row sm:items-center">
      <Avatar name={name} src={p.avatar_url} size={76} />
      <div class="min-w-0 flex-1">
        <h1 class="text-2xl font-extrabold tracking-tight">{name}</h1>
        <p class="text-sm text-muted">@{p.username}</p>
        {#if p.bio}<p class="mt-3 max-w-[60ch] whitespace-pre-line text-sm leading-relaxed">{p.bio}</p>{/if}
      </div>
      {#if data.isMe}
        <a href="/thiet-lap" class="btn btn-secondary self-start sm:self-center"><Pencil size={15} /> Sửa hồ sơ</a>
      {/if}
    </div>
    <div class="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-5 text-sm text-muted">
      <span class="inline-flex items-center gap-1.5"><FileText size={16} /> <b class="text-ink">{data.quizzes.length}</b> đề công khai</span>
      <span class="inline-flex items-center gap-1.5"><Users size={16} /> <b class="text-ink">{data.totalPlays}</b> lượt ôn</span>
      <span class="inline-flex items-center gap-1.5"><CalendarDays size={16} /> Tham gia {joined}</span>
    </div>
  </section>

  <section>
    <h2 class="mb-4 text-lg font-bold">Đề công khai</h2>
    {#if data.quizzes.length === 0}
      <EmptyState icon={FileText} title={data.isMe ? 'Bạn chưa có đề công khai nào' : `${name} chưa chia sẻ đề nào`}
        description={data.isMe ? 'Đề ở chế độ công khai sẽ hiện ở đây và trong trang Khám phá.' : undefined}>
        {#if data.isMe}<a href="/kho-de" class="btn btn-primary"><Plus size={16} /> Mở Kho đề</a>{/if}
      </EmptyState>
    {:else}
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {#each data.quizzes as quiz (quiz.id)}
          <QuizTile {quiz} showOwner={false} />
        {/each}
      </div>
    {/if}
  </section>
</div>
