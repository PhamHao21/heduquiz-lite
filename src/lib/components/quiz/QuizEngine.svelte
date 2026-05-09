<!-- src/lib/components/quiz/QuizEngine.svelte -->
<script lang="ts">
  import Timer from './Timer.svelte';
  import { shuffle } from '$lib/utils/shuffle';

  interface Option   { label: string; text: string; is_correct: boolean }
  interface Question { id: string; position: number; content: string; options: Option[]; multi: boolean }
  interface Answer   { question_id: string; chosen: string[]; correct: string[]; is_correct: boolean }

  interface Props {
    questions: Question[];
    timeLimit?: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    onComplete: (answers: Answer[], timeSpent: number) => void;
  }

  const {
    questions: rawQuestions,
    timeLimit        = 0,
    shuffleQuestions = true,
    shuffleOptions   = true,
    onComplete
  }: Props = $props();

  const questions: Question[] = (() => {
    const qs = shuffleQuestions ? shuffle([...rawQuestions]) : [...rawQuestions];
    return shuffleOptions ? qs.map(q => ({ ...q, options: shuffle([...q.options]) })) : qs;
  })();

  let current   = $state(0);
  let chosen    = $state<Record<string, string[]>>({});
  let submitted = $state(false);
  const startedAt = Date.now();

  const q             = $derived(questions[current]);
  const total         = questions.length;
  const pct           = $derived(Math.round(((current + 1) / total) * 100));
  const isLast        = $derived(current === total - 1);
  const currentChosen = $derived(chosen[q?.id] ?? []);

  function toggleOption(label: string) {
    if (submitted) return;
    const prev = chosen[q.id] ?? [];
    chosen = {
      ...chosen,
      [q.id]: q.multi
        ? prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        : [label]
    };
  }

  function handleSubmit() {
    if (submitted) return;
    submitted = true;
    const timeSpent = Math.round((Date.now() - startedAt) / 1000);
    const answers: Answer[] = questions.map(qItem => {
      const correctLabels = qItem.options.filter(o => o.is_correct).map(o => o.label);
      const chosenLabels  = chosen[qItem.id] ?? [];
      return {
        question_id: qItem.id,
        chosen:  chosenLabels,
        correct: correctLabels,
        is_correct: correctLabels.length === chosenLabels.length && correctLabels.every(l => chosenLabels.includes(l))
      };
    });
    onComplete(answers, timeSpent);
  }

  // Dùng inline style thay vì Tailwind text-* để không bị body {color: slate-100} ghi đè
  function optionStyle(label: string, is_correct: boolean): string {
    const sel = currentChosen.includes(label);
    if (!submitted) {
      return sel
        ? 'border-color:#6366f1;background:#eef2ff;color:#3730a3;'
        : 'border-color:#e2e8f0;background:#ffffff;color:#374151;';
    }
    if (is_correct)         return 'border-color:#10b981;background:#ecfdf5;color:#065f46;';
    if (sel && !is_correct) return 'border-color:#f87171;background:#fef2f2;color:#991b1b;';
    return 'border-color:#e2e8f0;background:#ffffff;color:#9ca3af;opacity:0.7;';
  }

  function badgeStyle(label: string, is_correct: boolean): string {
    const sel = currentChosen.includes(label);
    if (!submitted) {
      return sel
        ? 'background:#6366f1;border-color:#6366f1;color:#ffffff;'
        : 'background:#ffffff;border-color:#cbd5e1;color:#94a3b8;';
    }
    if (is_correct)         return 'background:#10b981;border-color:#10b981;color:#ffffff;';
    if (sel && !is_correct) return 'background:#f87171;border-color:#f87171;color:#ffffff;';
    return 'background:#ffffff;border-color:#e2e8f0;color:#cbd5e1;';
  }
</script>

<!--
  Wrapper dùng style inline buộc màu chữ + nền,
  tránh bị app.css body { color: slate-100 } làm chữ trắng trên nền trắng
-->
<div class="flex flex-col gap-6" style="color:#1e293b;">

  <!-- Progress + Timer -->
  <div class="flex items-center gap-4">
    <div class="flex-1">
      <div class="mb-1 flex justify-between text-xs" style="color:#64748b;">
        <span>Câu {current + 1} / {total}</span>
        <span>{pct}%</span>
      </div>
      <div class="h-2 overflow-hidden rounded-full" style="background:#e2e8f0;">
        <div class="h-full rounded-full transition-all duration-300" style="width:{pct}%;background:#6366f1;"></div>
      </div>
    </div>
    {#if timeLimit > 0}
      <Timer seconds={timeLimit} onExpire={handleSubmit} />
    {/if}
  </div>

  <!-- Question card -->
  <div class="rounded-xl p-6 shadow-sm" style="background:#ffffff;border:1px solid #e2e8f0;">
    <div class="mb-3 flex items-center gap-2">
      <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" style="background:#eef2ff;color:#4338ca;">
        {q.position}
      </span>
      {#if q.multi}
        <span class="rounded-full px-2 py-0.5 text-xs font-semibold" style="background:#fef3c7;color:#92400e;">
          Chọn nhiều
        </span>
      {/if}
    </div>
    <p class="whitespace-pre-line text-base font-medium leading-relaxed" style="color:#1e293b;">
      {q.content}
    </p>
  </div>

  <!-- Options grid -->
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
    {#each q.options as opt (opt.label || opt.text)}
      <button
        onclick={() => toggleOption(opt.label)}
        disabled={submitted}
        class="flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 text-left text-sm transition-all"
        style={optionStyle(opt.label, opt.is_correct)}
      >
        <span
          class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all"
          style={badgeStyle(opt.label, opt.is_correct)}
        >
          {opt.label || '·'}
        </span>
        <span class="flex-1 whitespace-pre-line font-medium">{opt.text}</span>
        {#if submitted && opt.is_correct}
          <span style="color:#059669;font-weight:bold;">✓</span>
        {:else if submitted && currentChosen.includes(opt.label) && !opt.is_correct}
          <span style="color:#dc2626;font-weight:bold;">✗</span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- Navigation -->
  <div class="flex items-center justify-between">
    <button
      onclick={() => { if (current > 0) current--; }}
      disabled={current === 0}
      class="rounded-lg border px-4 py-2 text-sm font-medium transition disabled:opacity-40"
      style="background:#ffffff;border-color:#e2e8f0;color:#475569;"
    >← Trước</button>

    <div class="flex flex-wrap justify-center gap-1.5">
      {#each questions as qDot, i (i)}
        <button
          onclick={() => { current = i; }}
          class="h-2.5 w-2.5 rounded-full transition-all"
          style="
            transform: {i === current ? 'scale(1.25)' : 'scale(1)'};
            background: {i === current ? '#6366f1' : (chosen[qDot.id]?.length ? '#a5b4fc' : '#cbd5e1')};
          "
        ></button>
      {/each}
    </div>

    {#if isLast}
      <button
        onclick={handleSubmit}
        disabled={submitted}
        class="rounded-lg px-5 py-2 text-sm font-semibold shadow transition disabled:opacity-50"
        style="background:#4f46e5;color:#ffffff;"
      >Nộp bài</button>
    {:else}
      <button
        onclick={() => { if (current < total - 1) current++; }}
        class="rounded-lg border px-4 py-2 text-sm font-medium transition"
        style="background:#ffffff;border-color:#e2e8f0;color:#475569;"
      >Tiếp →</button>
    {/if}
  </div>
</div>
