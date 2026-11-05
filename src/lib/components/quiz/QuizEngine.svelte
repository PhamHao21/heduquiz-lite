<!-- src/lib/components/quiz/QuizEngine.svelte -->
<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import Timer from './Timer.svelte';
  import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
  import {
    arrangeQuestions, arrangementOf, clearProgress, displayLetter, gradeAttempt, saveProgress,
    type Answer, type AttemptMode, type Question, type QuizProgress
  } from '$lib/utils/attempt';

  interface Props {
    quizId: string;
    /** 'review' = lượt ôn câu sai (được lưu kèm tiến trình để làm tiếp) */
    mode?: AttemptMode;
    sectionId?: string | null;
    questions: Question[];
    /** giới hạn thời gian (giây), 0 = không giới hạn */
    timeLimit?: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    /** tiến trình đã lưu để làm tiếp sau khi refresh/đóng tab */
    resume?: QuizProgress | null;
    onComplete: (answers: Answer[], timeSpent: number) => void;
  }

  const props: Props = $props();

  // Ảnh chụp các prop lúc bắt đầu lượt làm bài: đổi prop giữa chừng không làm xáo lại đề.
  const init = untrack(() => ({ ...props }));
  const resume = init.resume ?? null;

  const questions: Question[] = arrangeQuestions(
    init.questions,
    { shuffleQuestions: init.shuffleQuestions ?? true, shuffleOptions: init.shuffleOptions ?? true },
    resume
  );
  const total = questions.length;
  const timeLimit = init.timeLimit ?? 0;
  const startedAt = resume?.startedAt ?? Date.now();
  const endsAt: number | null = resume ? resume.endsAt : timeLimit > 0 ? startedAt + timeLimit * 1000 : null;

  let current     = $state(Math.min(Math.max(resume?.current ?? 0, 0), Math.max(total - 1, 0)));
  let chosen      = $state<Record<string, string[]>>(resume?.chosen ?? {});
  let submitted   = $state(false);
  let confirmOpen = $state(false);

  const q             = $derived(questions[current]);
  const pct           = $derived(Math.round(((current + 1) / total) * 100));
  const isLast        = $derived(current === total - 1);
  const currentChosen = $derived(chosen[q?.id] ?? []);
  const unanswered    = $derived(questions.filter(item => !(chosen[item.id]?.length)).length);

  // Tự lưu tiến trình mỗi khi chọn đáp án / chuyển câu → refresh hay lỡ đóng tab vẫn làm tiếp được.
  const arrangement = arrangementOf(questions);
  $effect(() => {
    if (submitted) return;
    saveProgress({
      v: 1,
      quizId: init.quizId,
      mode: init.mode ?? 'normal',
      sectionId: init.sectionId ?? null,
      ...arrangement,
      chosen,
      current,
      startedAt,
      endsAt,
      savedAt: Date.now()
    });
  });

  // Làm tiếp một bài đã hết giờ trong lúc tab bị đóng → nộp luôn.
  onMount(() => {
    if (endsAt !== null && Date.now() >= endsAt) submit();
  });

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

  /** Bấm "Nộp bài": còn câu chưa làm thì hỏi lại trước. */
  function requestSubmit() {
    if (submitted) return;
    if (unanswered > 0) confirmOpen = true;
    else submit();
  }

  function submit() {
    if (submitted) return;
    submitted = true;
    confirmOpen = false;
    clearProgress(init.quizId);
    const finishedAt = endsAt !== null ? Math.min(Date.now(), endsAt) : Date.now();
    const timeSpent = Math.max(0, Math.round((finishedAt - startedAt) / 1000));
    props.onComplete(gradeAttempt(questions, chosen), timeSpent);
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

<ConfirmModal
  open={confirmOpen}
  title="Nộp bài?"
  message={`Bạn còn ${unanswered} câu chưa trả lời. Câu bỏ trống sẽ bị tính sai.`}
  confirmLabel="Nộp luôn"
  cancelLabel="Làm tiếp"
  onConfirm={submit}
  onCancel={() => { confirmOpen = false; }}
/>

<!--
  Wrapper dùng style inline buộc màu chữ + nền,
  tránh bị app.css body { color: slate-100 } làm chữ trắng trên nền trắng
-->
<div class="flex flex-col gap-6" style="color:#1e293b;">

  <!-- Progress + Timer -->
  <div class="flex items-center gap-4">
    <div class="flex-1">
      <div class="mb-1 flex justify-between text-xs" style="color:#64748b;">
        <span>Câu {current + 1} / {total} · đã làm {total - unanswered}</span>
        <button
          onclick={requestSubmit}
          disabled={submitted}
          class="font-semibold underline-offset-2 hover:underline"
          style="color:#4f46e5;"
        >Nộp bài</button>
      </div>
      <div class="h-2 overflow-hidden rounded-full" style="background:#e2e8f0;">
        <div class="h-full rounded-full transition-all duration-300" style="width:{pct}%;background:#6366f1;"></div>
      </div>
    </div>
    {#if endsAt !== null}
      <Timer {endsAt} totalSeconds={timeLimit || Math.round((endsAt - startedAt) / 1000)} onExpire={submit} />
    {/if}
  </div>

  <!-- Question card -->
  <div class="rounded-xl p-6 shadow-sm" style="background:#ffffff;border:1px solid #e2e8f0;">
    <div class="mb-3 flex items-center gap-2">
      <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" style="background:#eef2ff;color:#4338ca;">
        Câu {current + 1}
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
    {#each q.options as opt, oi (opt.label)}
      <button
        onclick={() => toggleOption(opt.label)}
        disabled={submitted}
        class="flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 text-left text-sm transition-all"
        style={optionStyle(opt.label, opt.is_correct)}
      >
        <!-- Chữ cái theo vị trí trên màn hình (A, B, C…), kể cả khi đáp án đã bị đảo -->
        <span
          class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all"
          style={badgeStyle(opt.label, opt.is_correct)}
        >
          {displayLetter(oi)}
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
  <div class="flex items-center justify-between gap-3">
    <button
      onclick={() => { if (current > 0) current--; }}
      disabled={current === 0}
      class="shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition disabled:opacity-40"
      style="background:#ffffff;border-color:#e2e8f0;color:#475569;"
    >← Trước</button>

    <div class="flex flex-wrap justify-center gap-1.5">
      {#each questions as qDot, i (qDot.id)}
        <button
          onclick={() => { current = i; }}
          aria-label="Câu {i + 1}{chosen[qDot.id]?.length ? ' (đã làm)' : ''}"
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
        onclick={requestSubmit}
        disabled={submitted}
        class="shrink-0 rounded-lg px-5 py-2 text-sm font-semibold shadow transition disabled:opacity-50"
        style="background:#4f46e5;color:#ffffff;"
      >Nộp bài</button>
    {:else}
      <button
        onclick={() => { if (current < total - 1) current++; }}
        class="shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition"
        style="background:#ffffff;border-color:#e2e8f0;color:#475569;"
      >Tiếp →</button>
    {/if}
  </div>
</div>
