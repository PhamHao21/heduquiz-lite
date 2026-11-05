<!-- src/lib/components/quiz/QuizTile.svelte -->
<!-- Thẻ một đề công khai: ảnh bìa, tiêu đề, số câu, lượt ôn, tim, tác giả.
     Link phủ toàn thẻ là một lớp riêng để nút tim / link tác giả bấm được độc lập. -->
<script lang="ts">
  import { ListChecks, Users } from 'lucide-svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import QuizCover from './QuizCover.svelte';
  import LikeButton from '$lib/components/social/LikeButton.svelte';

  interface Props {
    quiz: {
      id: string;
      title: string;
      subject: string | null;
      play_count: number;
      like_count?: number | null;
      question_count?: number | null;
      owner_name?: string | null;
      owner_avatar?: string | null;
      owner_username?: string | null;
    };
    liked?: boolean;
    showOwner?: boolean;
  }
  const { quiz, liked = false, showOwner = true }: Props = $props();
</script>

<article class="card card-hover group relative flex flex-col overflow-hidden">
  <QuizCover id={quiz.id} title={quiz.title} subject={quiz.subject} class="h-24" />
  <div class="flex flex-1 flex-col p-4">
    <h3 class="line-clamp-2 text-[15px] font-bold leading-snug text-ink group-hover:text-accent">
      <a href="/quiz/{quiz.id}" class="after:absolute after:inset-0 after:content-['']">{quiz.title}</a>
    </h3>
    <div class="mt-3 flex items-center gap-3 text-xs font-medium text-muted">
      {#if quiz.question_count != null}
        <span class="inline-flex items-center gap-1"><ListChecks size={14} /> {quiz.question_count} câu</span>
      {/if}
      <span class="inline-flex items-center gap-1"><Users size={14} /> {quiz.play_count}</span>
      <span class="relative z-10 ml-auto"><LikeButton quizId={quiz.id} count={quiz.like_count ?? 0} {liked} variant="chip" /></span>
    </div>
    {#if showOwner && quiz.owner_name}
      <div class="mt-3 flex items-center gap-2 border-t border-line pt-3">
        <Avatar name={quiz.owner_name} src={quiz.owner_avatar} size={22} />
        {#if quiz.owner_username}
          <a href="/u/{quiz.owner_username}" class="relative z-10 truncate text-xs font-semibold text-muted hover:text-ink hover:underline">{quiz.owner_name}</a>
        {:else}
          <span class="truncate text-xs font-semibold text-muted">{quiz.owner_name}</span>
        {/if}
      </div>
    {/if}
  </div>
</article>
