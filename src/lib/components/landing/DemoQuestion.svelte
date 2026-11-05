<!-- src/lib/components/landing/DemoQuestion.svelte -->
<!-- Câu hỏi mẫu làm được thật ngay trên trang chủ (chế độ Học), thay cho ảnh chụp màn hình. -->
<script lang="ts">
  import { Check, X, ArrowRight, RotateCcw } from 'lucide-svelte';

  interface DemoQ { content: string; options: { text: string; correct: boolean }[]; multi?: boolean; explanation: string }

  const QUESTIONS: DemoQ[] = [
    {
      content: 'Nguyên tố nào có kí hiệu hoá học là Fe?',
      options: [
        { text: 'Flo', correct: false },
        { text: 'Sắt', correct: true },
        { text: 'Phốt pho', correct: false },
        { text: 'Chì', correct: false }
      ],
      explanation: 'Fe là kí hiệu của sắt, lấy từ tên Latin "ferrum".'
    },
    {
      content: 'Đạo hàm của hàm số y = x² là',
      options: [
        { text: 'x', correct: false },
        { text: '2x', correct: true },
        { text: 'x²/2', correct: false },
        { text: '2', correct: false }
      ],
      explanation: 'Theo công thức (xⁿ)′ = n·xⁿ⁻¹ nên (x²)′ = 2x.'
    },
    {
      content: 'Chọn tất cả các số nguyên tố',
      multi: true,
      options: [
        { text: '2', correct: true },
        { text: '4', correct: false },
        { text: '5', correct: true },
        { text: '9', correct: false }
      ],
      explanation: '2 và 5 chỉ chia hết cho 1 và chính nó; 4 = 2·2, 9 = 3·3.'
    }
  ];

  let index = $state(0);
  let picked = $state<number[]>([]);
  let revealed = $state(false);
  let score = $state(0);

  const q = $derived(QUESTIONS[index]);
  const isRight = $derived(
    q.options.every((o, i) => o.correct === picked.includes(i))
  );
  const done = $derived(index >= QUESTIONS.length - 1 && revealed);

  function choose(i: number) {
    if (revealed) return;
    if (q.multi) {
      picked = picked.includes(i) ? picked.filter(x => x !== i) : [...picked, i];
    } else {
      picked = [i];
      reveal();
    }
  }
  function reveal() {
    if (revealed || picked.length === 0) return;
    revealed = true;
    if (isRight) score++;
  }
  function next() {
    if (index < QUESTIONS.length - 1) {
      index++;
      picked = [];
      revealed = false;
    } else {
      index = 0; picked = []; revealed = false; score = 0;
    }
  }

  function optionClass(i: number) {
    const o = q.options[i];
    const sel = picked.includes(i);
    if (!revealed) return sel ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line bg-surface hover:border-line-strong';
    if (o.correct) return 'border-success bg-success-soft text-ink';
    if (sel) return 'border-danger bg-danger-soft text-ink';
    return 'border-line bg-surface opacity-60';
  }
</script>

<div class="card p-5 shadow-xl sm:p-6" style="box-shadow: 0 24px 60px -24px hsl(var(--shadow-color) / 0.25);">
  <div class="mb-4 flex items-center justify-between text-xs font-semibold text-muted">
    <span>Thử ngay · câu {index + 1}/{QUESTIONS.length}</span>
    <span class="tag">Chế độ Học</span>
  </div>
  <p class="text-lg font-semibold leading-snug text-ink">{q.content}</p>
  {#if q.multi}<p class="mt-1 text-xs font-medium text-warning">Có thể chọn nhiều đáp án</p>{/if}

  <div class="mt-4 grid gap-2">
    {#each q.options as o, i (o.text)}
      <button
        class="flex items-center gap-3 rounded-xl border-2 px-3.5 py-3 text-left text-sm font-medium transition {optionClass(i)}"
        onclick={() => choose(i)}
        aria-pressed={picked.includes(i)}
      >
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-bold">
          {String.fromCharCode(65 + i)}
        </span>
        <span class="flex-1">{o.text}</span>
        {#if revealed && o.correct}<Check size={16} class="text-success" />{/if}
        {#if revealed && !o.correct && picked.includes(i)}<X size={16} class="text-danger" />{/if}
      </button>
    {/each}
  </div>

  {#if q.multi && !revealed}
    <button class="btn btn-primary mt-4 w-full" disabled={picked.length === 0} onclick={reveal}>Kiểm tra</button>
  {/if}

  {#if revealed}
    <div class="rise-in mt-4 rounded-xl px-4 py-3 text-sm {isRight ? 'bg-success-soft' : 'bg-danger-soft'}" role="status">
      <p class="font-semibold {isRight ? 'text-success' : 'text-danger'}">{isRight ? 'Chính xác!' : 'Chưa đúng.'}</p>
      <p class="mt-1 text-ink">{q.explanation}</p>
    </div>
    <button class="btn btn-secondary mt-3 w-full" onclick={next}>
      {#if done}<RotateCcw size={16} /> Làm lại ({score}/{QUESTIONS.length} câu đúng){:else}Câu tiếp <ArrowRight size={16} />{/if}
    </button>
  {/if}
</div>
