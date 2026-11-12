<!-- src/routes/lich-su/[id]/+page.svelte -->
<script lang="ts">
  import { ArrowLeft, RotateCcw, CheckCircle2, XCircle, MinusCircle, Check, X, Clock, CalendarDays } from 'lucide-svelte';
  import QuizCover from '$lib/components/quiz/QuizCover.svelte';
  import { displayLetter } from '$lib/utils/attempt';
  import { formatDuration } from '$lib/utils/stats';

  const { data } = $props();
  const r = $derived(data.result);
  const pct = $derived(r.total ? Math.round((r.score / r.total) * 100) : 0);

  let filter = $state<'all' | 'wrong' | 'right'>('all');
  const wrong = $derived(data.answers.filter(a => !a.is_correct).length);
  const shown = $derived(
    data.answers.map((a, i) => ({ a, i })).filter(({ a }) => filter === 'all' || (filter === 'wrong') !== a.is_correct)
  );
  const when = $derived(new Date(r.completed_at).toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }));

  function optionClass(isCorrect: boolean, chosen: boolean) {
    if (isCorrect) return 'border-success bg-success-soft';
    if (chosen) return 'border-danger bg-danger-soft';
    return 'border-line';
  }
</script>

<svelte:head><title>Xem lại bài làm{data.quiz ? `: ${data.quiz.title}` : ''} · HeduQuiz</title></svelte:head>

<div class="mx-auto max-w-3xl space-y-5">
  <a href="/lich-su" class="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={16} /> Lịch sử làm bài</a>

  <section class="card overflow-hidden">
    <QuizCover id={data.quizId} title={data.quiz?.title ?? '?'} subject={data.quiz?.subject} class="h-20" />
    <div class="flex flex-wrap items-center gap-5 p-6">
      <div class="min-w-0 flex-1">
        <h1 class="text-xl font-extrabold tracking-tight">{data.quiz?.title ?? 'Đề không còn truy cập được'}</h1>
        <p class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span class="inline-flex items-center gap-1.5"><CalendarDays size={15} /> {when}</span>
          {#if r.time_spent}<span class="inline-flex items-center gap-1.5"><Clock size={15} /> {formatDuration(r.time_spent)}</span>{/if}
        </p>
      </div>
      <div class="text-right">
        <p class="text-4xl font-extrabold">{pct}%</p>
        <p class="text-sm text-muted">{r.score}/{r.total} câu đúng</p>
      </div>
    </div>
    {#if data.quiz}
      <div class="flex flex-wrap gap-2 border-t border-line px-6 py-4">
        <a href="/quiz/{data.quizId}" class="btn btn-primary btn-sm"><RotateCcw size={15} /> Làm lại đề này</a>
        <a href="/quiz/{data.quizId}/the-ghi-nho" class="btn btn-secondary btn-sm">Ôn bằng thẻ ghi nhớ</a>
      </div>
    {/if}
  </section>

  <div class="flex flex-wrap items-center justify-between gap-2">
    <h2 class="font-bold">Chi tiết từng câu</h2>
    <div class="segmented" role="group" aria-label="Lọc câu">
      <button aria-pressed={filter === 'all'} onclick={() => { filter = 'all'; }}>Tất cả {data.answers.length}</button>
      <button aria-pressed={filter === 'wrong'} onclick={() => { filter = 'wrong'; }}>Sai {wrong}</button>
      <button aria-pressed={filter === 'right'} onclick={() => { filter = 'right'; }}>Đúng {data.answers.length - wrong}</button>
    </div>
  </div>

  {#each shown as { a, i } (a.question_id)}
    <article class="card p-5">
      <div class="flex items-start gap-3">
        {#if a.is_correct}<CheckCircle2 size={20} class="mt-0.5 shrink-0 text-success" />
        {:else if a.chosen.length === 0}<MinusCircle size={20} class="mt-0.5 shrink-0 text-faint" />
        {:else}<XCircle size={20} class="mt-0.5 shrink-0 text-danger" />{/if}
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold text-faint">Câu {i + 1}{a.chosen.length === 0 && !a.is_correct ? ' · bỏ trống' : ''}</p>
          {#if a.question}
            <p class="mt-0.5 whitespace-pre-line font-medium">{a.question.content}</p>
            <div class="mt-3 grid gap-2 sm:grid-cols-2">
              {#each a.question.options as o, oi (oi)}
                {@const chosen = a.chosen.includes(o.label)}
                <div class="flex items-start gap-2.5 rounded-xl border-2 px-3 py-2.5 text-sm {optionClass(o.is_correct, chosen)}">
                  <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold {o.is_correct ? 'border-success bg-success text-surface' : chosen ? 'border-danger bg-danger text-surface' : 'border-line-strong text-muted'}">{displayLetter(oi)}</span>
                  <span class="flex-1 whitespace-pre-line">{o.text}</span>
                  {#if chosen}<span class="shrink-0 text-[11px] font-semibold {o.is_correct ? 'text-success' : 'text-danger'}">{#if o.is_correct}<Check size={14} />{:else}<X size={14} />{/if}</span>{/if}
                </div>
              {/each}
            </div>
            {#if a.question.explanation}
              <p class="mt-3 whitespace-pre-line rounded-xl bg-sunken px-3.5 py-2.5 text-sm"><span class="font-semibold">Giải thích:</span> {a.question.explanation}</p>
            {/if}
          {:else}
            <p class="mt-1 text-sm text-muted">Câu hỏi này đã bị sửa hoặc xoá khỏi đề.</p>
          {/if}
        </div>
      </div>
    </article>
  {:else}
    <p class="rounded-2xl border border-dashed border-line-strong py-8 text-center text-sm text-muted">Không có câu nào trong mục này.</p>
  {/each}
</div>
