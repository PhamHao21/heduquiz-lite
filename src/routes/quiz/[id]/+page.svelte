<!-- src/routes/quiz/[id]/+page.svelte -->
<script lang="ts">
  import QuizEngine from '$lib/components/quiz/QuizEngine.svelte';
  import { authStore } from '$lib/stores/auth.svelte';
  import { Clock, RotateCcw, Trophy, ChevronRight, Edit, Shuffle, Timer } from 'lucide-svelte';

  const { data } = $props();
  const { quiz, questions, history, isOwner } = data;

  type Answer  = { question_id: string; chosen: string[]; correct: string[]; is_correct: boolean };
  type Phase   = 'intro' | 'options' | 'playing' | 'result';
  interface Section { id: string; name: string; from: number; to: number }

  let phase         = $state<Phase>('intro');
  let resultData    = $state<{ answers: Answer[]; timeSpent: number } | null>(null);

  let shuffleQ      = $state(true);
  let shuffleOpts   = $state(true);
  let timeLimitMins = $state(0);
  let selectedSec   = $state<string | null>(null);

  const sections: Section[] = (quiz.sections as Section[]) ?? [];
  const hasSection = sections.length > 0;

  const activeQuestions = $derived(() => {
    if (!selectedSec) return questions;
    const sec = sections.find((s: Section) => s.id === selectedSec);
    if (!sec) return questions;
    return questions.filter((q: { position: number }) => q.position >= sec.from && q.position <= sec.to);
  });

  const timeLimitSecs = $derived(timeLimitMins * 60);
  const total  = questions.length;
  const score  = $derived(resultData?.answers.filter(a => a.is_correct).length ?? 0);
  const pct    = $derived(resultData ? Math.round((score / resultData.answers.length) * 100) : 0);

  const grade = $derived(() => {
    if (pct >= 90) return { text: 'Xuất sắc 🏆', color: '#4338ca' };
    if (pct >= 75) return { text: 'Giỏi 🎉',     color: '#059669' };
    if (pct >= 50) return { text: 'Trung bình',   color: '#d97706' };
    return             { text: 'Cần ôn thêm 📚',  color: '#dc2626' };
  });

  async function handleComplete(answers: Answer[], timeSpent: number) {
    resultData = { answers, timeSpent };
    phase = 'result';
    if (authStore.isAuthed) {
      await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: quiz.id, score: answers.filter(a => a.is_correct).length,
          total: answers.length, time_spent: timeSpent, answers
        })
      });
    }
  }

  function startQuiz() { resultData = null; phase = 'playing'; }

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('vi-VN');
  }

  const TIME_OPTIONS = [
    { label: 'Không giới hạn', value: 0 },
    { label: '15 phút', value: 15 },
    { label: '30 phút', value: 30 },
    { label: '45 phút', value: 45 },
    { label: '60 phút', value: 60 },
  ];
</script>

<svelte:head><title>{quiz.title} — HeduQuiz</title></svelte:head>

<!--
  Tất cả các trang con đều wrap trong div có color + background explicit
  để cô lập hoàn toàn khỏi body { color: slate-100 } của app.css (JJK theme)
-->
<div class="mx-auto max-w-2xl" style="color:#1e293b;">

  <!-- ── INTRO ── -->
  {#if phase === 'intro'}
    <div class="space-y-5">
      <div class="rounded-[2.5rem] p-8 shadow-sm" style="background:#ffffff;border:1px solid #f1f5f9;">
        {#if quiz.subject}
          <span class="mb-3 inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
            style="background:#eef2ff;color:#4338ca;">
            {quiz.subject}
          </span>
        {/if}
        <h1 class="text-2xl font-black tracking-tight" style="color:#0f172a;">{quiz.title}</h1>
        {#if quiz.description}
          <p class="mt-2 text-sm" style="color:#64748b;">{quiz.description}</p>
        {/if}

        <div class="mt-5 flex flex-wrap gap-4 text-sm" style="color:#64748b;">
          <span class="flex items-center gap-1.5"><Clock size={14} /> {total} câu hỏi</span>
          <span class="flex items-center gap-1.5"><Trophy size={14} /> {quiz.play_count} lượt ôn</span>
        </div>

        <div class="mt-6 flex gap-3">
          <button
            onclick={() => { phase = 'options'; }}
            class="flex-1 rounded-2xl py-4 text-sm font-black uppercase tracking-widest shadow-lg transition-all hover:opacity-90"
            style="background:#4f46e5;color:#ffffff;"
          >
            Bắt đầu ôn thi →
          </button>
          {#if isOwner}
            <a
              href="/tao-de?edit={quiz.id}"
              class="flex items-center gap-2 rounded-2xl border px-4 py-4 text-sm font-bold transition-all hover:border-indigo-300"
              style="border-color:#e2e8f0;color:#475569;background:#ffffff;"
            >
              <Edit size={16} />
            </a>
          {/if}
        </div>
      </div>

      {#if history.length > 0}
        <div class="rounded-[2rem] p-6 shadow-sm" style="background:#ffffff;border:1px solid #f1f5f9;">
          <h2 class="mb-4 text-xs font-black uppercase tracking-widest" style="color:#94a3b8;">Lịch sử ôn thi</h2>
          <div class="space-y-2">
            {#each history as h (h.id)}
              <div class="flex items-center justify-between rounded-xl px-4 py-3" style="background:#f8fafc;">
                <span class="text-xs font-bold" style="color:#64748b;">{formatDate(h.completed_at)}</span>
                <div class="flex items-center gap-4">
                  {#if h.time_spent}
                    <span class="text-xs" style="color:#94a3b8;">{formatTime(h.time_spent)}</span>
                  {/if}
                  <span class="font-black" style="color:#4338ca;">{h.score}/{h.total}</span>
                  <span class="text-xs font-bold" style="color:{Math.round(h.score/h.total*100) >= 75 ? '#059669' : '#d97706'};">
                    {Math.round(h.score/h.total*100)}%
                  </span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

  <!-- ── OPTIONS ── -->
  {:else if phase === 'options'}
    <div class="rounded-[2.5rem] p-8 shadow-sm space-y-6" style="background:#ffffff;border:1px solid #f1f5f9;">
      <h2 class="text-lg font-black tracking-tight" style="color:#0f172a;">Tùy chọn ôn thi</h2>

      {#if hasSection}
        <div class="space-y-2">
          <p class="text-[10px] font-black uppercase tracking-widest" style="color:#94a3b8;">Chọn phần thi</p>
          <div class="space-y-2">
            <button
              onclick={() => { selectedSec = null; }}
              class="flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-sm font-bold transition"
              style="border-color:{selectedSec === null ? '#6366f1' : '#e2e8f0'};background:{selectedSec === null ? '#eef2ff' : '#ffffff'};color:{selectedSec === null ? '#4338ca' : '#475569'};"
            >
              <span>📚 Toàn bộ đề ({total} câu)</span>
              {#if selectedSec === null}<span style="color:#818cf8;">✓</span>{/if}
            </button>
            {#each sections as sec (sec.id)}
              {@const cnt = questions.filter((q: { position: number }) => q.position >= sec.from && q.position <= sec.to).length}
              <button
                onclick={() => { selectedSec = sec.id; }}
                class="flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-sm font-bold transition"
                style="border-color:{selectedSec === sec.id ? '#6366f1' : '#e2e8f0'};background:{selectedSec === sec.id ? '#eef2ff' : '#ffffff'};color:{selectedSec === sec.id ? '#4338ca' : '#475569'};"
              >
                <span>📋 {sec.name} (câu {sec.from}–{sec.to} · {cnt} câu)</span>
                {#if selectedSec === sec.id}<span style="color:#818cf8;">✓</span>{/if}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Xáo trộn -->
      <div class="space-y-2">
        <p class="text-[10px] font-black uppercase tracking-widest" style="color:#94a3b8;">Xáo trộn</p>
        <div class="grid grid-cols-2 gap-3">
          <button
            onclick={() => { shuffleQ = !shuffleQ; }}
            class="flex items-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-bold transition"
            style="border-color:{shuffleQ ? '#6366f1' : '#e2e8f0'};background:{shuffleQ ? '#eef2ff' : '#ffffff'};color:{shuffleQ ? '#4338ca' : '#64748b'};"
          >
            <Shuffle size={15} /> Đảo câu hỏi
            {#if shuffleQ}<span class="ml-auto text-xs" style="color:#818cf8;">ON</span>{/if}
          </button>
          <button
            onclick={() => { shuffleOpts = !shuffleOpts; }}
            class="flex items-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-bold transition"
            style="border-color:{shuffleOpts ? '#6366f1' : '#e2e8f0'};background:{shuffleOpts ? '#eef2ff' : '#ffffff'};color:{shuffleOpts ? '#4338ca' : '#64748b'};"
          >
            <Shuffle size={15} /> Đảo đáp án
            {#if shuffleOpts}<span class="ml-auto text-xs" style="color:#818cf8;">ON</span>{/if}
          </button>
        </div>
      </div>

      <!-- Timer -->
      <div class="space-y-2">
        <p class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style="color:#94a3b8;">
          <Timer size={12} /> Giới hạn thời gian
        </p>
        <div class="flex flex-wrap gap-2">
          {#each TIME_OPTIONS as opt (opt.value)}
            <button
              onclick={() => { timeLimitMins = opt.value; }}
              class="rounded-xl border-2 px-4 py-2 text-[11px] font-black uppercase transition"
              style="border-color:{timeLimitMins === opt.value ? '#6366f1' : '#e2e8f0'};background:{timeLimitMins === opt.value ? '#eef2ff' : '#ffffff'};color:{timeLimitMins === opt.value ? '#4338ca' : '#64748b'};"
            >
              {opt.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="flex gap-3 pt-2">
        <button
          onclick={() => { phase = 'intro'; }}
          class="rounded-2xl border px-5 py-3 text-sm font-bold transition hover:opacity-80"
          style="border-color:#e2e8f0;background:#ffffff;color:#475569;"
        >← Quay lại</button>
        <button
          onclick={startQuiz}
          disabled={activeQuestions().length === 0}
          class="flex-1 rounded-2xl py-3 text-sm font-black uppercase tracking-widest shadow-lg transition hover:opacity-90 disabled:opacity-50"
          style="background:#4f46e5;color:#ffffff;"
        >
          Bắt đầu ({activeQuestions().length} câu)
        </button>
      </div>
    </div>

  <!-- ── PLAYING ── -->
  {:else if phase === 'playing'}
    <QuizEngine
      questions={activeQuestions()}
      timeLimit={timeLimitSecs}
      shuffleQuestions={shuffleQ}
      shuffleOptions={shuffleOpts}
      onComplete={handleComplete}
    />

  <!-- ── RESULT ── -->
  {:else if phase === 'result' && resultData}
    <div class="space-y-5">
      <!-- Score card -->
      <div class="rounded-[2.5rem] p-8 text-center shadow-sm" style="background:#ffffff;border:1px solid #f1f5f9;">
        <p class="text-6xl font-black" style="color:#4338ca;">{pct}%</p>
        <p class="mt-1 text-lg font-black" style="color:{grade().color};">{grade().text}</p>
        <p class="mt-2 text-sm" style="color:#64748b;">
          {score}/{resultData.answers.length} câu đúng · {formatTime(resultData.timeSpent)}
        </p>

        <div class="mx-auto mt-5 h-3 max-w-xs overflow-hidden rounded-full" style="background:#e2e8f0;">
          <div class="h-full rounded-full transition-all" style="width:{pct}%;background:#6366f1;"></div>
        </div>

        <div class="mt-6 flex justify-center gap-3">
          <!-- Fix nút Làm lại: text màu tối explicit -->
          <button
            onclick={() => { resultData = null; phase = 'options'; }}
            class="flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-bold transition hover:opacity-80"
            style="border-color:#e2e8f0;background:#ffffff;color:#374151;"
          >
            <RotateCcw size={16} /> Làm lại
          </button>
          <a
            href="/kho-de"
            class="flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition hover:opacity-90"
            style="background:#4f46e5;color:#ffffff;"
          >
            Kho đề <ChevronRight size={16} />
          </a>
        </div>
      </div>

      <!-- Chi tiết đáp án -->
      <div class="space-y-3">
        <h2 class="px-1 text-xs font-black uppercase tracking-widest" style="color:#94a3b8;">Chi tiết đáp án</h2>
        {#each resultData.answers as ans, i (ans.question_id)}
          {@const q = questions.find((q: {id: string}) => q.id === ans.question_id)}
          {#if q}
            <div class="rounded-2xl border p-4"
              style="border-color:{ans.is_correct ? '#6ee7b7' : '#fca5a5'};background:{ans.is_correct ? '#ecfdf5' : '#fef2f2'};">
              <p class="mb-1 text-[10px] font-black uppercase"
                style="color:{ans.is_correct ? '#059669' : '#dc2626'};">
                {ans.is_correct ? '✓ Đúng' : '✗ Sai'} — Câu {i + 1}
              </p>
              <p class="text-sm font-medium" style="color:#1e293b;">{q.content}</p>
              {#if !ans.is_correct}
                <p class="mt-2 text-xs" style="color:#64748b;">
                  Bạn chọn: <span class="font-bold" style="color:#dc2626;">{ans.chosen.join(', ') || '(bỏ trống)'}</span>
                  · Đúng: <span class="font-bold" style="color:#059669;">{ans.correct.join(', ')}</span>
                </p>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
</div>
