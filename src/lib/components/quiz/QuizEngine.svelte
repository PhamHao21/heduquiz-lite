<!-- src/lib/components/quiz/QuizEngine.svelte -->
<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { ArrowLeft, ArrowRight, Flag, LayoutGrid, Send, Check, X, GraduationCap } from 'lucide-svelte';
  import Timer from './Timer.svelte';
  import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
  import {
    arrangeQuestions, arrangementOf, clearProgress, displayLetter, gradeAttempt, isAnswerCorrect, saveProgress,
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
    /** chế độ Học: chọn xong là hiện đáp án đúng + giải thích ngay */
    study?: boolean;
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
  const study = resume ? !!resume.study : !!init.study;

  let current     = $state(Math.min(Math.max(resume?.current ?? 0, 0), Math.max(total - 1, 0)));
  let chosen      = $state<Record<string, string[]>>(resume?.chosen ?? {});
  let submitted   = $state(false);
  let confirmOpen = $state(false);
  /** (chế độ Học) các câu đã hiện đáp án, không đổi được lựa chọn nữa */
  let revealed    = $state<Record<string, boolean>>(resume?.revealed ?? {});
  /** các câu đánh dấu để xem lại trước khi nộp */
  let flagged     = $state<Record<string, boolean>>(resume?.flagged ?? {});
  /** (điện thoại) mở bảng số câu */
  let showNav     = $state(false);

  const q             = $derived(questions[current]);
  const isLast        = $derived(current === total - 1);
  const currentChosen = $derived(chosen[q?.id] ?? []);
  const answered      = $derived(questions.filter(item => chosen[item.id]?.length).length);
  const unanswered    = $derived(total - answered);
  const flaggedCount  = $derived(questions.filter(item => flagged[item.id]).length);
  /** câu hiện tại đã hiện đáp án chưa (đã nộp bài, hoặc chế độ Học đã kiểm tra) */
  const qRevealed     = $derived(submitted || !!revealed[q?.id]);
  const qCorrect      = $derived(q ? isAnswerCorrect(q, currentChosen) : false);
  const correctLetters = $derived(
    q ? q.options.map((o, i) => (o.is_correct ? displayLetter(i) : null)).filter(Boolean).join(', ') : ''
  );
  /** (chế độ Học) số câu đã kiểm tra và số câu đúng */
  const studyChecked  = $derived(questions.filter(item => revealed[item.id]));
  const studyCorrect  = $derived(studyChecked.filter(item => isAnswerCorrect(item, chosen[item.id] ?? [])).length);

  // Tự lưu tiến trình mỗi khi chọn đáp án / chuyển câu → refresh hay lỡ đóng tab vẫn làm tiếp được.
  const arrangement = arrangementOf(questions);
  $effect(() => {
    if (submitted) return;
    saveProgress({
      v: 1,
      quizId: init.quizId,
      mode: init.mode ?? 'normal',
      sectionId: init.sectionId ?? null,
      study,
      revealed,
      flagged,
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
    if (qRevealed) return;
    const prev = chosen[q.id] ?? [];
    chosen = {
      ...chosen,
      [q.id]: q.multi
        ? prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        : [label]
    };
    // Chế độ Học: câu một đáp án chọn xong là hiện kết quả luôn.
    if (study && !q.multi) revealed = { ...revealed, [q.id]: true };
  }

  /** Chế độ Học, câu nhiều đáp án: chọn xong bấm "Kiểm tra". */
  function checkAnswer() {
    if (!study || qRevealed || currentChosen.length === 0) return;
    revealed = { ...revealed, [q.id]: true };
  }

  function toggleFlag() {
    flagged = { ...flagged, [q.id]: !flagged[q.id] };
  }

  function goTo(i: number) {
    current = Math.min(Math.max(i, 0), total - 1);
    showNav = false;
  }
  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  // Phím tắt: A–H hoặc 1–8 chọn đáp án, ←/→ chuyển câu, M đánh dấu, Enter: kiểm tra / câu tiếp / nộp bài.
  function onKeydown(e: KeyboardEvent) {
    if (submitted || confirmOpen || e.ctrlKey || e.metaKey || e.altKey) return;
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return;

    const key = e.key;
    let index = -1;
    if (/^[1-8]$/.test(key)) index = Number(key) - 1;
    else if (/^[a-h]$/i.test(key)) index = key.toUpperCase().charCodeAt(0) - 65;
    if (index >= 0) {
      if (index < q.options.length) {
        e.preventDefault();
        toggleOption(q.options[index].label);
      }
      return;
    }

    if (key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (key === 'm' || key === 'M') { e.preventDefault(); toggleFlag(); }
    else if (key === 'Enter' && target?.tagName !== 'BUTTON' && target?.tagName !== 'A') {
      e.preventDefault();
      if (study && q.multi && !qRevealed && currentChosen.length > 0) checkAnswer();
      else if (!isLast) next();
      else requestSubmit();
    }
  }

  /** Bấm "Nộp bài": còn câu chưa làm hoặc còn câu đánh dấu thì hỏi lại trước. */
  function requestSubmit() {
    if (submitted) return;
    if (unanswered > 0 || flaggedCount > 0) confirmOpen = true;
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

  const confirmMessage = $derived(
    [
      unanswered > 0 ? `Bạn còn ${unanswered} câu chưa trả lời, câu bỏ trống sẽ bị tính sai.` : '',
      flaggedCount > 0 ? `Có ${flaggedCount} câu bạn đã đánh dấu để xem lại.` : ''
    ].filter(Boolean).join(' ')
  );

  function optionClass(label: string, isCorrect: boolean) {
    const sel = currentChosen.includes(label);
    if (!qRevealed) return sel ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-line-strong';
    if (isCorrect) return 'border-success bg-success-soft';
    if (sel) return 'border-danger bg-danger-soft';
    return 'border-line bg-surface opacity-55';
  }
  function letterClass(label: string, isCorrect: boolean) {
    const sel = currentChosen.includes(label);
    if (!qRevealed) return sel ? 'border-accent bg-accent text-on-accent' : 'border-line-strong text-muted';
    if (isCorrect) return 'border-success bg-success text-surface';
    if (sel) return 'border-danger bg-danger text-surface';
    return 'border-line text-faint';
  }
  function cellClass(item: Question, i: number) {
    const ring = i === current ? 'ring-2 ring-accent ring-offset-1 ring-offset-surface' : '';
    if (study && revealed[item.id]) {
      return `${ring} ${isAnswerCorrect(item, chosen[item.id] ?? []) ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`;
    }
    if (chosen[item.id]?.length) return `${ring} bg-accent-soft text-accent-ink`;
    return `${ring} bg-sunken text-muted hover:text-ink`;
  }
</script>

<svelte:window onkeydown={onKeydown} />

<ConfirmModal
  open={confirmOpen}
  title="Nộp bài?"
  message={confirmMessage}
  confirmLabel="Nộp luôn"
  cancelLabel="Làm tiếp"
  onConfirm={submit}
  onCancel={() => { confirmOpen = false; }}
/>

{#snippet navigator(cols: string)}
  <div class="grid {cols} gap-1.5" role="group" aria-label="Danh sách câu hỏi">
    {#each questions as item, i (item.id)}
      <button
        onclick={() => goTo(i)}
        class="relative flex aspect-square items-center justify-center rounded-lg text-xs font-bold tabular-nums transition {cellClass(item, i)}"
        aria-label="Câu {i + 1}{chosen[item.id]?.length ? ', đã làm' : ''}{flagged[item.id] ? ', đã đánh dấu' : ''}"
        aria-current={i === current ? 'step' : undefined}
      >
        {i + 1}
        {#if flagged[item.id]}<span class="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-warning"></span>{/if}
      </button>
    {/each}
  </div>
  <div class="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
    <span class="inline-flex items-center gap-1"><span class="h-2.5 w-2.5 rounded bg-accent-soft ring-1 ring-accent/40"></span> Đã làm</span>
    <span class="inline-flex items-center gap-1"><span class="h-2.5 w-2.5 rounded bg-sunken"></span> Chưa làm</span>
    <span class="inline-flex items-center gap-1"><span class="h-1.5 w-1.5 rounded-full bg-warning"></span> Đánh dấu</span>
  </div>
{/snippet}

<div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_288px] lg:items-start">
  <section class="min-w-0 space-y-4">
    <!-- Thanh trạng thái (điện thoại) -->
    <div class="flex items-center gap-2 lg:hidden">
      <button class="btn btn-secondary btn-sm" onclick={() => { showNav = !showNav; }} aria-expanded={showNav}>
        <LayoutGrid size={15} /> {current + 1}/{total}
      </button>
      <span class="text-xs text-muted">Đã làm {answered}</span>
      <div class="ml-auto flex items-center gap-2">
        {#if endsAt !== null}<Timer {endsAt} totalSeconds={timeLimit || Math.round((endsAt - startedAt) / 1000)} onExpire={submit} />{/if}
        <button class="btn btn-primary btn-sm" onclick={requestSubmit} disabled={submitted}>Nộp bài</button>
      </div>
    </div>
    {#if showNav}
      <div class="card rise-in p-4 lg:hidden">{@render navigator('grid-cols-8 sm:grid-cols-10')}</div>
    {/if}

    <!-- Câu hỏi -->
    <article class="card p-5 sm:p-7">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm font-bold text-accent">Câu {current + 1}</span>
        <span class="text-sm text-faint">/ {total}</span>
        {#if q.multi}<span class="tag bg-warning-soft text-warning">Chọn nhiều đáp án</span>{/if}
        {#if study}<span class="tag"><GraduationCap size={12} /> Chế độ Học</span>{/if}
        <button
          onclick={toggleFlag}
          class="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition {flagged[q.id] ? 'bg-warning-soft text-warning' : 'text-muted hover:bg-sunken hover:text-ink'}"
          aria-pressed={!!flagged[q.id]}
          title="Đánh dấu để xem lại (phím M)"
        >
          <Flag size={13} fill={flagged[q.id] ? 'currentColor' : 'none'} /> {flagged[q.id] ? 'Đã đánh dấu' : 'Đánh dấu'}
        </button>
      </div>

      <p class="mt-4 whitespace-pre-line text-[17px] font-semibold leading-relaxed text-ink">{q.content}</p>

      <div class="mt-6 grid gap-2.5 sm:grid-cols-2">
        {#each q.options as opt, oi (opt.label)}
          <button
            onclick={() => toggleOption(opt.label)}
            aria-pressed={currentChosen.includes(opt.label)}
            aria-disabled={qRevealed}
            class="flex items-start gap-3 rounded-xl border-2 p-3.5 text-left text-[15px] text-ink transition {qRevealed ? 'cursor-default' : 'active:scale-[0.99]'} {optionClass(opt.label, opt.is_correct)}"
          >
            <!-- Chữ cái theo vị trí trên màn hình (A, B, C…), kể cả khi đáp án đã bị đảo -->
            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition {letterClass(opt.label, opt.is_correct)}">
              {displayLetter(oi)}
            </span>
            <span class="flex-1 whitespace-pre-line pt-0.5 font-medium">{opt.text}</span>
            {#if qRevealed && opt.is_correct}<Check size={18} class="mt-1 shrink-0 text-success" />{/if}
            {#if qRevealed && !opt.is_correct && currentChosen.includes(opt.label)}<X size={18} class="mt-1 shrink-0 text-danger" />{/if}
          </button>
        {/each}
      </div>

      <!-- Chế độ Học: nút kiểm tra (câu nhiều đáp án) và kết quả + giải thích -->
      {#if study && q.multi && !qRevealed}
        <button onclick={checkAnswer} disabled={currentChosen.length === 0} class="btn btn-primary mt-5 w-full sm:w-auto">
          Kiểm tra
        </button>
      {/if}
      {#if study && qRevealed}
        <div class="rise-in mt-5 rounded-xl p-4 text-sm {qCorrect ? 'bg-success-soft' : 'bg-danger-soft'}" role="status">
          <p class="font-bold {qCorrect ? 'text-success' : 'text-danger'}">
            {#if qCorrect}Chính xác!{:else}Chưa đúng. Đáp án đúng: {correctLetters}{/if}
          </p>
          {#if q.explanation}
            <p class="mt-2 whitespace-pre-line leading-relaxed text-ink"><span class="font-semibold">Giải thích:</span> {q.explanation}</p>
          {/if}
        </div>
      {/if}
    </article>

    <!-- Điều hướng -->
    <div class="flex items-center justify-between gap-3">
      <button onclick={prev} disabled={current === 0} class="btn btn-secondary"><ArrowLeft size={16} /> Câu trước</button>
      {#if isLast}
        <button onclick={requestSubmit} disabled={submitted} class="btn btn-primary"><Send size={16} /> Nộp bài</button>
      {:else}
        <button onclick={next} class="btn btn-secondary">Câu tiếp <ArrowRight size={16} /></button>
      {/if}
    </div>

    <p class="hidden text-center text-xs text-faint sm:block">
      Phím tắt: <kbd class="font-sans font-semibold text-muted">A-D</kbd> chọn đáp án,
      <kbd class="font-sans font-semibold text-muted">← →</kbd> chuyển câu,
      <kbd class="font-sans font-semibold text-muted">M</kbd> đánh dấu,
      <kbd class="font-sans font-semibold text-muted">Enter</kbd> {study ? 'kiểm tra hoặc ' : ''}sang câu tiếp
    </p>
  </section>

  <!-- Bảng điều khiển (máy tính) -->
  <aside class="card hidden space-y-4 p-5 lg:sticky lg:top-24 lg:block">
    {#if endsAt !== null}
      <Timer {endsAt} totalSeconds={timeLimit || Math.round((endsAt - startedAt) / 1000)} onExpire={submit} />
    {/if}
    <div>
      <div class="flex items-baseline justify-between text-sm">
        <span class="font-semibold">Đã làm {answered}/{total}</span>
        {#if study && studyChecked.length > 0}<span class="text-xs font-semibold text-success">Đúng {studyCorrect}/{studyChecked.length}</span>{/if}
      </div>
      <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken">
        <div class="h-full rounded-full bg-accent transition-[width] duration-300" style="width:{(answered / total) * 100}%"></div>
      </div>
    </div>
    {@render navigator('grid-cols-6')}
    <button onclick={requestSubmit} disabled={submitted} class="btn btn-primary w-full"><Send size={16} /> Nộp bài</button>
  </aside>
</div>
