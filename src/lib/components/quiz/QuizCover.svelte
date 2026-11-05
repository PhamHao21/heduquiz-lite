<!-- src/lib/components/quiz/QuizCover.svelte -->
<!-- Ảnh bìa tự sinh cho một đề: gradient theo id + chữ viết tắt tiêu đề. -->
<script lang="ts">
  import { coverStyle, initials } from '$lib/utils/cover';
  interface Props { id: string; title: string; subject?: string | null; class?: string }
  const { id, title, subject = null, class: klass = 'h-28' }: Props = $props();
</script>

<div class="relative overflow-hidden {klass}" style={coverStyle(id)} aria-hidden="true">
  <span class="absolute -bottom-3 right-3 select-none text-[64px] font-extrabold leading-none tracking-tighter text-white/25">
    {initials(title)}
  </span>
  {#if subject}
    <span class="absolute left-3 top-3 rounded-full bg-black/25 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">{subject}</span>
  {/if}
</div>
