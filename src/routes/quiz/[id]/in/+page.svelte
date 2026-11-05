<!-- src/routes/quiz/[id]/in/+page.svelte -->
<script lang="ts">
  import { ArrowLeft, Printer, Download } from 'lucide-svelte';
  import { displayLetter } from '$lib/utils/attempt';
  import { quizToText, safeFileName } from '$lib/utils/exportText';

  const { data } = $props();
  const quiz = $derived(data.quiz);

  type Option = { text: string; is_correct: boolean };
  type Q = { id: string; content: string; options: Option[]; multi: boolean; explanation: string | null };
  const questions = $derived(data.questions as Q[]);

  /** none: đề trắng · inline: tô đáp án ngay trong câu · key: bảng đáp án cuối đề */
  let answers = $state<'none' | 'inline' | 'key'>('key');
  let withExplanation = $state(false);
  let withNameLine = $state(true);

  const correctLetters = (q: Q) => q.options.map((o, i) => (o.is_correct ? displayLetter(i) : null)).filter(Boolean).join(', ');

  function downloadText() {
    const blob = new Blob([quizToText(questions)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeFileName(quiz.title, 'txt');
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head><title>In đề: {quiz.title} · HeduQuiz</title></svelte:head>

<div class="mx-auto max-w-4xl">
  <!-- Thanh công cụ (không in) -->
  <div class="no-print mb-6 space-y-4">
    <a href="/quiz/{quiz.id}" class="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
      <ArrowLeft size={16} /> Về trang đề
    </a>
    <div class="card flex flex-wrap items-end gap-x-6 gap-y-4 p-5">
      <div>
        <p class="label">Đáp án</p>
        <div class="segmented" role="group" aria-label="Cách hiện đáp án">
          <button aria-pressed={answers === 'none'} onclick={() => { answers = 'none'; }}>Không hiện</button>
          <button aria-pressed={answers === 'key'} onclick={() => { answers = 'key'; }}>Cuối đề</button>
          <button aria-pressed={answers === 'inline'} onclick={() => { answers = 'inline'; }}>Trong từng câu</button>
        </div>
      </div>
      <label class="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" bind:checked={withExplanation} disabled={answers === 'none'} class="h-4 w-4 accent-[var(--accent)]" />
        Kèm giải thích
      </label>
      <label class="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" bind:checked={withNameLine} class="h-4 w-4 accent-[var(--accent)]" />
        Dòng họ tên
      </label>
      <div class="ml-auto flex gap-2">
        <button onclick={downloadText} class="btn btn-secondary"><Download size={16} /> Tải .txt</button>
        <button onclick={() => window.print()} class="btn btn-primary"><Printer size={16} /> In / Lưu PDF</button>
      </div>
    </div>
    <p class="text-xs text-muted">Mẹo: trong hộp thoại in, chọn "Lưu dưới dạng PDF" để có file PDF. File .txt nhập lại được vào HeduQuiz.</p>
  </div>

  <!-- Tờ đề (luôn nền trắng chữ đen như giấy, kể cả ở giao diện tối) -->
  <article class="sheet mx-auto rounded-2xl bg-white px-6 py-8 text-[#111] shadow-sm ring-1 ring-black/5 sm:px-12 sm:py-12 print:rounded-none print:p-0 print:shadow-none print:ring-0">
    <header class="border-b border-black/15 pb-4 text-center">
      <h1 class="text-xl font-extrabold">{quiz.title}</h1>
      <p class="mt-1 text-sm text-black/60">{quiz.subject ? `${quiz.subject}, ` : ''}{questions.length} câu hỏi</p>
      {#if withNameLine}
        <div class="mt-5 grid grid-cols-[1fr_auto] gap-6 text-left text-sm">
          <span>Họ và tên: ..................................................................</span>
          <span>Lớp: ....................</span>
        </div>
      {/if}
    </header>

    <ol class="mt-6 space-y-5">
      {#each questions as q, i (q.id)}
        <li class="break-inside-avoid">
          <p class="font-semibold"><span class="mr-1">Câu {i + 1}.</span><span class="whitespace-pre-line font-normal">{q.content}</span>
            {#if q.multi}<em class="text-sm font-normal text-black/60"> (chọn nhiều đáp án)</em>{/if}</p>
          <div class="mt-2 grid gap-x-6 gap-y-1 pl-4 text-[15px] {q.options.every(o => o.text.length <= 28) ? 'grid-cols-2' : 'grid-cols-1'}">
            {#each q.options as o, oi (oi)}
              <p class="whitespace-pre-line {answers === 'inline' && o.is_correct ? 'font-bold underline' : ''}">
                <span class="font-semibold">{displayLetter(oi)}.</span> {o.text}
              </p>
            {/each}
          </div>
          {#if answers === 'inline' && withExplanation && q.explanation}
            <p class="mt-1.5 pl-4 text-sm italic text-black/70">Giải thích: {q.explanation}</p>
          {/if}
        </li>
      {/each}
    </ol>

    {#if answers === 'key'}
      <section class="mt-10 break-before-page border-t border-black/15 pt-6">
        <h2 class="text-center font-extrabold">Đáp án</h2>
        <div class="mt-4 grid grid-cols-5 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-8">
          {#each questions as q, i (q.id)}
            <span><b>{i + 1}.</b> {correctLetters(q)}</span>
          {/each}
        </div>
        {#if withExplanation}
          <ol class="mt-6 space-y-2 text-sm">
            {#each questions as q, i (q.id)}
              {#if q.explanation}<li><b>Câu {i + 1}:</b> {q.explanation}</li>{/if}
            {/each}
          </ol>
        {/if}
      </section>
    {/if}
  </article>
</div>

<style>
  @media print {
    :global(main) { padding: 0 !important; max-width: none !important; }
    .sheet { font-size: 12pt; }
  }
</style>
