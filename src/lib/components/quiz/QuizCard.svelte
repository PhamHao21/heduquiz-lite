<!-- src/lib/components/quiz/QuizCard.svelte -->
<script lang="ts">
  interface Props {
    id: string;
    title: string;
    subject?: string | null;
    play_count?: number;
    created_at?: string;
    author?: string | null;
    showAuthor?: boolean;
  }

  const {
    id, title, subject = null,
    play_count = 0, created_at = '',
    author = null, showAuthor = true
  }: Props = $props();

  const date = $derived(
    created_at ? new Date(created_at).toLocaleDateString('vi-VN') : ''
  );
</script>

<a
  href="/quiz/{id}"
  class="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-600"
>
  {#if subject}
    <span class="w-fit rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
      {subject}
    </span>
  {/if}

  <h3 class="line-clamp-2 flex-1 font-semibold leading-snug text-slate-800 group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-indigo-400">
    {title}
  </h3>

  <div class="flex items-center gap-3 text-xs text-slate-400">
    <span>▶ {play_count} lượt</span>
    {#if showAuthor && author}
      <span>·</span>
      <span class="truncate">{author}</span>
    {/if}
    {#if date}
      <span class="ml-auto shrink-0">{date}</span>
    {/if}
  </div>
</a>
