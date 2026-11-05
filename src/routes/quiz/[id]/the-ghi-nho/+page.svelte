<!-- src/routes/quiz/[id]/the-ghi-nho/+page.svelte -->
<!-- Thẻ ghi nhớ: lật thẻ xem đáp án, tự đánh giá "đã nhớ / chưa nhớ", ôn lại thẻ chưa nhớ. -->
<script lang="ts">
  import { untrack } from 'svelte';
  import { ArrowLeft, RotateCcw, Shuffle, Check, X, Repeat, Play, Layers } from 'lucide-svelte';
  import { shuffle } from '$lib/utils/shuffle';
  import { displayLetter } from '$lib/utils/attempt';

  const { data } = $props();
  const quiz = $derived(data.quiz);

  type Option = { text: string; is_correct: boolean };
  type Card = { id: string; content: string; options: Option[]; multi: boolean; explanation: string | null };
  const all = $derived(data.questions as Card[]);

  // Khởi tạo ngay (cả khi render trên server) để không loé màn hình kết quả rỗng
  let deck = $state<Card[]>(untrack(() => [...(data.questions as Card[])]));
  let index = $state(0);
  let flipped = $state(false);
  let known = $state<Record<string, boolean>>({});
  let shuffled = $state(false);
  let round = $state(1);

  function start(cards: Card[]) {
    deck = shuffled ? shuffle([...cards]) : [...cards];
    index = 0;
    flipped = false;
  }

  const card = $derived(deck[index]);
  const done = $derived(deck.length > 0 && index >= deck.length);
  const knownCount = $derived(deck.filter(c => known[c.id]).length);
  const unknownCards = $derived(deck.filter(c => known[c.id] === false));

  function mark(isKnown: boolean) {
    if (!card) return;
    known = { ...known, [card.id]: isKnown };
    flipped = false;
    index++;
  }
  function restart() { known = {}; round = 1; start(all); }
  function reviewUnknown() { const rest = unknownCards; known = {}; round++; start(rest); }
  function toggleShuffle() { shuffled = !shuffled; known = {}; start(all); }

  function onKeydown(e: KeyboardEvent) {
    if (done || !card || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flipped = !flipped; }
    else if (flipped && (e.key === 'ArrowLeft' || e.key === '1')) { e.preventDefault(); mark(false); }
    else if (flipped && (e.key === 'ArrowRight' || e.key === '2')) { e.preventDefault(); mark(true); }
  }
</script>

<svelte:window onkeydown={onKeydown} />
<svelte:head><title>Thẻ ghi nhớ: {quiz.title} · HeduQuiz</title></svelte:head>

<div class="mx-auto max-w-2xl space-y-5">
  <div class="flex flex-wrap items-center gap-3">
    <a href="/quiz/{quiz.id}" class="btn btn-ghost btn-icon" aria-label="Về trang đề"><ArrowLeft size={18} /></a>
    <div class="min-w-0 flex-1">
      <h1 class="flex items-center gap-2 text-xl font-extrabold tracking-tight"><Layers size={20} class="text-accent" /> Thẻ ghi nhớ</h1>
      <p class="truncate text-sm text-muted">{quiz.title}</p>
    </div>
    <button onclick={toggleShuffle} aria-pressed={shuffled} class="chip {shuffled ? 'chip-active' : ''}"><Shuffle size={14} /> Đảo thẻ</button>
  </div>

  {#if all.length === 0}
    <p class="rounded-2xl border border-dashed border-line-strong py-12 text-center text-muted">Đề này chưa có câu hỏi nào.</p>
  {:else if !done && card}
    <div>
      <div class="mb-2 flex justify-between text-xs font-semibold text-muted">
        <span>Thẻ {index + 1}/{deck.length}{round > 1 ? ` · lượt ôn lại ${round - 1}` : ''}</span>
        <span class="text-success">Đã nhớ {knownCount}</span>
      </div>
      <div class="h-1.5 overflow-hidden rounded-full bg-sunken">
        <div class="h-full rounded-full bg-accent transition-[width] duration-300" style="width:{(index / deck.length) * 100}%"></div>
      </div>
    </div>

    <button class="flip-scene block w-full text-left" onclick={() => { flipped = !flipped; }} aria-label={flipped ? 'Lật về câu hỏi' : 'Lật xem đáp án'}>
      <div class="flip-card relative min-h-[320px]" class:is-flipped={flipped}>
        <div class="flip-face card absolute inset-0 flex flex-col overflow-y-auto p-7">
          <span class="text-xs font-bold uppercase tracking-wide text-accent">Câu hỏi</span>
          <p class="my-auto whitespace-pre-line py-6 text-center text-xl font-bold leading-relaxed sm:text-2xl">{card.content}</p>
          <span class="text-center text-xs text-faint">Bấm vào thẻ hoặc nhấn Space để lật</span>
        </div>
        <div class="flip-face flip-back card absolute inset-0 flex flex-col overflow-y-auto p-7">
          <span class="text-xs font-bold uppercase tracking-wide text-success">Đáp án{card.multi ? ' (nhiều đáp án)' : ''}</span>
          <ul class="my-auto space-y-2 py-4">
            {#each card.options as o, oi (oi)}
              {#if o.is_correct}
                <li class="flex items-start gap-3 rounded-xl bg-success-soft px-4 py-3 text-lg font-semibold">
                  <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-success text-xs font-bold text-surface">{displayLetter(oi)}</span>
                  <span class="whitespace-pre-line">{o.text}</span>
                </li>
              {/if}
            {/each}
          </ul>
          {#if card.explanation}
            <p class="whitespace-pre-line rounded-xl bg-sunken px-4 py-3 text-sm leading-relaxed"><span class="font-semibold">Giải thích:</span> {card.explanation}</p>
          {/if}
        </div>
      </div>
    </button>

    <div class="grid grid-cols-2 gap-3">
      <button onclick={() => mark(false)} disabled={!flipped} class="btn btn-lg border border-danger/30 bg-danger-soft text-danger hover:border-danger">
        <X size={18} /> Chưa nhớ
      </button>
      <button onclick={() => mark(true)} disabled={!flipped} class="btn btn-lg border border-success/30 bg-success-soft text-success hover:border-success">
        <Check size={18} /> Đã nhớ
      </button>
    </div>
    <p class="hidden text-center text-xs text-faint sm:block">Space: lật thẻ · ←: chưa nhớ · →: đã nhớ</p>
  {:else}
    <section class="card rise-in p-8 text-center">
      <p class="text-5xl font-extrabold tabular-nums">{knownCount}<span class="text-2xl text-faint">/{deck.length}</span></p>
      <p class="mt-2 text-lg font-bold">{unknownCards.length === 0 ? 'Bạn đã nhớ hết các thẻ!' : `Còn ${unknownCards.length} thẻ chưa nhớ`}</p>
      <p class="mt-1 text-sm text-muted">Ôn lại những thẻ chưa nhớ đến khi thuộc hết, rồi thử thi thử.</p>
      <div class="mt-6 flex flex-wrap justify-center gap-2">
        {#if unknownCards.length > 0}
          <button onclick={reviewUnknown} class="btn btn-primary"><Repeat size={16} /> Ôn lại {unknownCards.length} thẻ</button>
        {/if}
        <button onclick={restart} class="btn btn-secondary"><RotateCcw size={16} /> Từ đầu</button>
        <a href="/quiz/{quiz.id}" class="btn btn-secondary"><Play size={16} /> Thi thử đề này</a>
      </div>
    </section>
  {/if}
</div>

<style>
  .flip-scene { perspective: 1400px; }
  .flip-card { transform-style: preserve-3d; transition: transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1); }
  .flip-card.is-flipped { transform: rotateY(180deg); }
  .flip-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
  .flip-back { transform: rotateY(180deg); }
  @media (prefers-reduced-motion: reduce) {
    .flip-card { transition: none; }
  }
</style>
