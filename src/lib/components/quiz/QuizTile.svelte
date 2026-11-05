<!-- src/lib/components/quiz/QuizTile.svelte -->
<!-- Thẻ một đề công khai: dùng ở trang chủ, Khám phá, trang cá nhân. -->
<script lang="ts">
  import { ListChecks, Users } from 'lucide-svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';

  interface Props {
    quiz: {
      id: string;
      title: string;
      subject: string | null;
      play_count: number;
      question_count?: number | null;
      owner_name?: string | null;
      owner_avatar?: string | null;
    };
    showOwner?: boolean;
  }
  const { quiz, showOwner = true }: Props = $props();
</script>

<a href="/quiz/{quiz.id}" class="card card-hover group flex flex-col p-5">
  <div class="mb-3 flex min-h-[22px] items-center gap-2">
    {#if quiz.subject}<span class="tag">{quiz.subject}</span>{/if}
  </div>
  <h3 class="line-clamp-2 flex-1 text-[15px] font-bold leading-snug text-ink group-hover:text-accent">{quiz.title}</h3>
  <div class="mt-4 flex items-center gap-4 text-xs font-medium text-muted">
    {#if quiz.question_count != null}
      <span class="inline-flex items-center gap-1.5"><ListChecks size={14} /> {quiz.question_count} câu</span>
    {/if}
    <span class="inline-flex items-center gap-1.5"><Users size={14} /> {quiz.play_count} lượt ôn</span>
  </div>
  {#if showOwner && quiz.owner_name}
    <div class="mt-4 flex items-center gap-2 border-t border-line pt-3">
      <Avatar name={quiz.owner_name} src={quiz.owner_avatar} size={22} />
      <span class="truncate text-xs font-semibold text-muted">{quiz.owner_name}</span>
    </div>
  {/if}
</a>
