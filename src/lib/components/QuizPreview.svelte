<script lang="ts">
  import type { ParsedQuestion, ParseErrorCode } from '$lib/server/parser';

  interface Props {
    questions: ParsedQuestion[];
    stats: { total: number; valid: number; errorCount: number };
  }

  const { questions, stats }: Props = $props();

  const ERROR_LABELS: Record<ParseErrorCode, string> = {
    empty_question:        '⚠ Câu hỏi trống',
    no_answers:            '⚠ Không có đáp án',
    insufficient_answers:  '⚠ Ít hơn 2 đáp án',
    missing_correct_answer:'⚠ Thiếu đáp án đúng'
  };
</script>

<div class="flex h-full flex-col gap-4 overflow-y-auto pr-1">
  <!-- Stats bar -->
  <div class="flex items-center gap-3 rounded-lg bg-indigo-50 px-4 py-2 text-sm dark:bg-indigo-950/40">
    <span class="font-medium text-indigo-700 dark:text-indigo-300">{stats.total} câu</span>
    <span class="text-emerald-600 dark:text-emerald-400">✓ {stats.valid} hợp lệ</span>
    {#if stats.errorCount > 0}
      <span class="text-red-500">✗ {stats.errorCount} lỗi</span>
    {/if}
  </div>

  {#if questions.length === 0}
    <div class="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
      <p class="text-sm text-slate-400">Preview sẽ hiện ở đây…</p>
    </div>
  {:else}
    {#each questions as q (q.position)}
      <div class="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900
        {q.error
          ? 'border-red-300 dark:border-red-800'
          : 'border-slate-200 dark:border-slate-700'}">

        <!-- Question header -->
        <div class="mb-3 flex items-start gap-2">
          <span class="mt-0.5 shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            {q.position}
          </span>
          {#if q.multi}
            <span class="mt-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              Nhiều đáp án
            </span>
          {/if}
          {#if q.error}
            <span class="mt-0.5 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">
              {ERROR_LABELS[q.error]}
            </span>
          {/if}
        </div>

        <!-- Question content (supports \n from <br />) -->
        <p class="mb-4 whitespace-pre-line font-medium text-slate-800 dark:text-slate-100">
          {q.content || '(Nội dung trống)'}
        </p>

        <!-- Options -->
        {#if q.options.length > 0}
          <ul class="space-y-2">
            {#each q.options as opt (opt.text) }
              <li class="flex items-start gap-2 rounded-lg px-3 py-2 text-sm
                {opt.is_correct
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}">
                {#if opt.label}
                  <span class="shrink-0 font-semibold">{opt.label}.</span>
                {:else if opt.is_correct}
                  <span class="shrink-0">✓</span>
                {/if}
                <span class="whitespace-pre-line">{opt.text}</span>
                {#if opt.is_correct}
                  <span class="ml-auto shrink-0 text-emerald-500">✓</span>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/each}
  {/if}
</div>
