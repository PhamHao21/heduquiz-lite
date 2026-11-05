<!-- src/routes/quiz/[id]/+page.svelte -->
<script lang="ts">
  import { untrack } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import QuizEngine from '$lib/components/quiz/QuizEngine.svelte';
  import { answeredCount, clearProgress, loadProgress, type Answer, type AttemptMode, type QuizProgress } from '$lib/utils/attempt';
  import { Clock, RotateCcw, Trophy, ChevronRight, Edit, Shuffle, Timer, PlayCircle, Repeat, GraduationCap, FileCheck, Share2, Copy, Check, Lock, Globe } from 'lucide-svelte';

  const { data } = $props();
  // $derived để khi chuyển sang đề khác (cùng route /quiz/[id]) dữ liệu được cập nhật theo.
  const quiz      = $derived(data.quiz);
  const questions = $derived(data.questions);
  const history   = $derived(data.history);
  const isOwner   = $derived(data.isOwner);
  const review    = $derived(data.review);

  type Phase   = 'intro' | 'options' | 'playing' | 'result';
  type SaveState = 'idle' | 'saving' | 'saved' | 'guest' | 'error';
  interface Section { id: string; name: string; from: number; to: number }

  let phase         = $state<Phase>('intro');
  let resultData    = $state<{ answers: Answer[]; timeSpent: number } | null>(null);
  let saveState     = $state<SaveState>('idle');
  let saveMessage   = $state('');

  let shuffleQ      = $state(true);
  let shuffleOpts   = $state(true);
  let timeLimitMins = $state(0);
  let selectedSec   = $state<string | null>(null);
  /** chế độ Học: hiện đáp án + giải thích ngay sau mỗi câu */
  let studyMode     = $state(false);

  /** bài đang làm dở được lưu trên máy này */
  let savedProgress = $state<QuizProgress | null>(null);
  /** tiến trình truyền vào QuizEngine khi bấm "Làm tiếp" */
  let resume        = $state<QuizProgress | null>(null);

  /** 'review' = lượt ôn câu sai: chỉ gồm các câu trong reviewIds, không giới hạn thời gian */
  let mode          = $state<AttemptMode>('normal');
  let reviewIds     = $state<string[]>([]);
  let showAllReview = $state(false);

  // Mỗi khi mở một đề (kể cả chuyển từ đề này sang đề khác): về màn hình giới thiệu
  // và kiểm tra xem có bài đang làm dở không. Chạy ở trình duyệt nên đọc được localStorage.
  // Chỉ theo dõi id (giá trị nguyên thuỷ): sau khi lưu kết quả, invalidateAll() tạo object
  // quiz mới nhưng cùng id → không được reset về màn hình giới thiệu.
  const quizId = $derived(data.quiz.id);
  $effect(() => {
    const id = quizId;
    untrack(() => {
      phase = 'intro';
      resultData = null;
      selectedSec = null;
      resume = null;
      mode = 'normal';
      reviewIds = [];
      showAllReview = false;
      savedProgress = loadProgress(id);
    });
  });

  const sections   = $derived((quiz.sections as Section[] | null) ?? []);
  const hasSection = $derived(sections.length > 0);

  // Phạm vi "câu X → Y" của phần thi tính theo thứ tự câu trong đề (1..n), không theo
  // cột position — dữ liệu cũ có thể có position bị nhảy số khi đề từng có câu lỗi.
  function questionsInSection(sec: Section) {
    return questions.filter((_q: unknown, i: number) => i + 1 >= sec.from && i + 1 <= sec.to);
  }

  const activeQuestions = $derived(() => {
    if (!selectedSec) return questions;
    const sec = sections.find((s: Section) => s.id === selectedSec);
    if (!sec) return questions;
    return questionsInSection(sec);
  });

  const timeLimitSecs = $derived(timeLimitMins * 60);
  const total  = $derived(questions.length);
  const score  = $derived(resultData?.answers.filter(a => a.is_correct).length ?? 0);
  const pct    = $derived(resultData && resultData.answers.length ? Math.round((score / resultData.answers.length) * 100) : 0);

  const grade = $derived(() => {
    if (pct >= 90) return { text: 'Xuất sắc 🏆', color: '#4338ca' };
    if (pct >= 75) return { text: 'Giỏi 🎉',     color: '#059669' };
    if (pct >= 50) return { text: 'Trung bình',   color: '#d97706' };
    return             { text: 'Cần ôn thêm 📚',  color: '#dc2626' };
  });

  async function handleComplete(answers: Answer[], timeSpent: number) {
    resultData = { answers, timeSpent };
    savedProgress = null;
    resume = null;
    phase = 'result';
    saveState = 'saving';
    saveMessage = '';

    // Server chấm lại từ đáp án đúng trong DB, tăng lượt ôn, lưu lịch sử nếu đã đăng nhập.
    try {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: quiz.id,
          time_spent: timeSpent,
          answers: answers.map(a => ({ question_id: a.question_id, chosen: a.chosen }))
        })
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? `Lỗi ${res.status}`);
      const body = (await res.json()) as { saved?: boolean };
      saveState = body.saved ? 'saved' : 'guest';
      if (body.saved) await invalidateAll(); // cập nhật lịch sử ôn thi + lượt ôn
    } catch (e) {
      saveState = 'error';
      saveMessage = e instanceof Error ? e.message : 'Lỗi không xác định';
    }
  }

  function startQuiz() {
    clearProgress(quiz.id);
    savedProgress = null;
    resume = null;
    resultData = null;
    mode = 'normal';
    reviewIds = [];
    phase = 'playing';
  }

  /** Bắt đầu lượt ôn chỉ gồm các câu sai (không giới hạn thời gian). */
  function startReview(ids: string[]) {
    if (ids.length === 0) return;
    clearProgress(quiz.id);
    savedProgress = null;
    resume = null;
    resultData = null;
    mode = 'review';
    reviewIds = ids;
    selectedSec = null;
    phase = 'playing';
  }

  function continueQuiz() {
    if (!savedProgress) return;
    resume = savedProgress;
    mode = savedProgress.mode ?? 'normal';
    reviewIds = mode === 'review' ? savedProgress.order : [];
    selectedSec = savedProgress.sectionId;
    resultData = null;
    phase = 'playing';
  }

  function discardProgress() {
    clearProgress(quiz.id);
    savedProgress = null;
  }

  /** Câu hỏi cho lượt làm bài đang tiếp tục: đúng tập câu đã lưu. */
  const resumeQuestions = $derived(
    resume ? questions.filter((q: { id: string }) => resume!.order.includes(q.id)) : []
  );

  /** Câu hỏi cho lượt chơi hiện tại (tiếp tục / ôn câu sai / làm bình thường). */
  const playQuestions = $derived(
    resume ? resumeQuestions
    : mode === 'review' ? questions.filter((q: { id: string }) => reviewIds.includes(q.id))
    : activeQuestions()
  );

  type QuestionRow = { id: string; content: string };
  const questionById = $derived(new Map<string, QuestionRow>(questions.map((q: QuestionRow) => [q.id, q])));

  /** Câu cần ôn (sai ở lần gần nhất, theo lịch sử đã lưu) */
  const needsReview = $derived(review?.needsReview.filter(s => questionById.has(s.question_id)) ?? []);
  const reviewList  = $derived(showAllReview ? needsReview : needsReview.slice(0, 5));

  /** Câu sai trong lượt vừa nộp */
  const wrongInResult = $derived(resultData?.answers.filter(a => !a.is_correct).map(a => a.question_id) ?? []);

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('vi-VN');
  }

  // ── Chia sẻ đề ──
  const shareUrl   = $derived(`${page.url.origin}/quiz/${quiz.id}`);
  let shareOpen    = $state(false);
  let copied       = $state(false);
  let publishing   = $state(false);
  let shareError   = $state('');

  async function openShare() {
    shareError = '';
    // Điện thoại: dùng bảng chia sẻ của hệ điều hành (Zalo, Messenger…) nếu đề đã công khai.
    if (quiz.is_public && typeof navigator !== 'undefined' && 'share' in navigator && matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title: quiz.title, text: `Ôn thi "${quiz.title}" trên HeduQuiz`, url: shareUrl });
        return;
      } catch {
        // người dùng huỷ hoặc trình duyệt không cho → hiện bảng copy link
      }
    }
    shareOpen = !shareOpen;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // trình duyệt chặn clipboard → chọn sẵn ô link để người dùng tự copy
      (document.getElementById('share-url') as HTMLInputElement | null)?.select();
      return;
    }
    copied = true;
    setTimeout(() => { copied = false; }, 2000);
  }

  async function makePublic() {
    publishing = true;
    shareError = '';
    try {
      const res = await fetch('/api/quizzes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: quiz.id, is_public: true })
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? `Lỗi ${res.status}`);
      await invalidateAll();
    } catch (e) {
      shareError = e instanceof Error ? e.message : 'Lỗi không xác định';
    } finally {
      publishing = false;
    }
  }

  const ogDescription = $derived(
    `${total} câu hỏi${quiz.subject ? ` · ${quiz.subject}` : ''} — ôn thi trắc nghiệm miễn phí trên HeduQuiz`
  );

  const TIME_OPTIONS = [
    { label: 'Không giới hạn', value: 0 },
    { label: '15 phút', value: 15 },
    { label: '30 phút', value: 30 },
    { label: '45 phút', value: 45 },
    { label: '60 phút', value: 60 },
  ];
</script>

<svelte:head>
  <title>{quiz.title} — HeduQuiz</title>
  <meta name="description" content={ogDescription} />
  <!-- Thẻ xem trước khi gửi link qua Messenger, Zalo, Facebook… -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="HeduQuiz" />
  <meta property="og:title" content={quiz.title} />
  <meta property="og:description" content={ogDescription} />
  <meta property="og:url" content={shareUrl} />
  <meta name="twitter:card" content="summary" />
</svelte:head>

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

        {#if savedProgress}
          <div class="mt-6 rounded-2xl p-4" style="background:#eef2ff;border:1px solid #c7d2fe;">
            <p class="text-sm font-bold" style="color:#3730a3;">
              {savedProgress.mode === 'review' ? 'Bạn có lượt ôn câu sai đang làm dở' : 'Bạn có bài đang làm dở'}
            </p>
            <p class="mt-0.5 text-xs" style="color:#4f46e5;">
              Đã làm {answeredCount(savedProgress)}/{savedProgress.order.length} câu{savedProgress.endsAt
                ? ` · ${savedProgress.endsAt > Date.now() ? `còn ${formatTime(Math.ceil((savedProgress.endsAt - Date.now()) / 1000))}` : 'đã hết giờ'}`
                : ''}
            </p>
            <div class="mt-3 flex gap-2">
              <button
                onclick={continueQuiz}
                class="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider"
                style="background:#4f46e5;color:#ffffff;"
              ><PlayCircle size={14} /> Làm tiếp</button>
              <button
                onclick={discardProgress}
                class="rounded-xl border px-4 py-2 text-xs font-bold"
                style="border-color:#c7d2fe;background:#ffffff;color:#4338ca;"
              >Bỏ bài này</button>
            </div>
          </div>
        {/if}

        <div class="mt-6 flex gap-3">
          <button
            onclick={() => { phase = 'options'; }}
            class="flex-1 rounded-2xl py-4 text-sm font-black uppercase tracking-widest shadow-lg transition-all hover:opacity-90"
            style="background:#4f46e5;color:#ffffff;"
          >
            Bắt đầu ôn thi →
          </button>
          <button
            onclick={openShare}
            aria-label="Chia sẻ đề"
            title="Chia sẻ đề"
            class="flex items-center gap-2 rounded-2xl border px-4 py-4 text-sm font-bold transition-all hover:border-indigo-300"
            style="border-color:{shareOpen ? '#a5b4fc' : '#e2e8f0'};color:#475569;background:#ffffff;"
          >
            <Share2 size={16} />
          </button>
          {#if isOwner}
            <a
              href="/tao-de?edit={quiz.id}"
              aria-label="Sửa đề"
              title="Sửa đề"
              class="flex items-center gap-2 rounded-2xl border px-4 py-4 text-sm font-bold transition-all hover:border-indigo-300"
              style="border-color:#e2e8f0;color:#475569;background:#ffffff;"
            >
              <Edit size={16} />
            </a>
          {/if}
        </div>

        {#if shareOpen}
          <div class="mt-4 rounded-2xl p-4" style="background:#f8fafc;border:1px solid #e2e8f0;">
            {#if quiz.is_public}
              <p class="mb-2 flex items-center gap-1.5 text-xs font-bold" style="color:#059669;">
                <Globe size={13} /> Đề công khai — ai có link đều ôn được, không cần đăng nhập
              </p>
            {:else}
              <p class="mb-2 flex items-center gap-1.5 text-xs font-bold" style="color:#b45309;">
                <Lock size={13} /> Đề đang ở chế độ riêng tư — người khác mở link sẽ không xem được
              </p>
            {/if}
            <div class="flex gap-2">
              <input
                id="share-url"
                readonly
                value={shareUrl}
                onfocus={(e) => e.currentTarget.select()}
                class="min-w-0 flex-1 rounded-xl border px-3 py-2 text-xs"
                style="border-color:#e2e8f0;background:#ffffff;color:#334155;"
              />
              <button
                onclick={copyLink}
                class="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold"
                style="background:{copied ? '#059669' : '#4f46e5'};color:#ffffff;"
              >
                {#if copied}<Check size={14} /> Đã copy{:else}<Copy size={14} /> Copy link{/if}
              </button>
            </div>
            {#if !quiz.is_public && isOwner}
              <button
                onclick={makePublic}
                disabled={publishing}
                class="mt-3 flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold disabled:opacity-60"
                style="border-color:#6ee7b7;background:#ecfdf5;color:#047857;"
              >
                <Globe size={13} /> {publishing ? 'Đang chuyển…' : 'Chuyển sang công khai'}
              </button>
            {/if}
            {#if shareError}
              <p class="mt-2 text-xs" style="color:#dc2626;">Không đổi được chế độ: {shareError}</p>
            {/if}
          </div>
        {/if}
      </div>

      {#if needsReview.length > 0}
        <div class="rounded-[2rem] p-6 shadow-sm" style="background:#ffffff;border:1px solid #fde68a;">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="flex items-center gap-2 text-xs font-black uppercase tracking-widest" style="color:#b45309;">
                <Repeat size={14} /> Câu cần ôn lại
              </h2>
              <p class="mt-1 text-sm" style="color:#64748b;">
                {needsReview.length} câu bạn trả lời sai ở lần làm gần nhất. Ôn lại làm đúng thì câu sẽ tự rời khỏi danh sách.
              </p>
            </div>
            <button
              onclick={() => startReview(needsReview.map(s => s.question_id))}
              class="flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black uppercase tracking-wider shadow"
              style="background:#f59e0b;color:#ffffff;"
            >
              <Repeat size={14} /> Ôn {needsReview.length} câu sai
            </button>
          </div>

          <ul class="mt-4 space-y-2">
            {#each reviewList as stat (stat.question_id)}
              <li class="flex items-start justify-between gap-3 rounded-xl px-4 py-3" style="background:#fffbeb;">
                <span class="line-clamp-2 whitespace-pre-line text-sm" style="color:#1e293b;">
                  {questionById.get(stat.question_id)?.content}
                </span>
                <span class="shrink-0 text-xs font-bold" style="color:#b45309;">Sai {stat.wrong}/{stat.seen} lần</span>
              </li>
            {/each}
          </ul>
          {#if needsReview.length > 5}
            <button
              onclick={() => { showAllReview = !showAllReview; }}
              class="mt-3 text-xs font-bold hover:underline"
              style="color:#b45309;"
            >{showAllReview ? 'Thu gọn' : `Xem tất cả ${needsReview.length} câu`}</button>
          {/if}
        </div>
      {:else if review && review.attemptsCounted > 0}
        <p class="px-2 text-xs" style="color:#059669;">✓ Bạn đã làm đúng tất cả các câu ở lần làm gần nhất.</p>
      {/if}

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
              {@const cnt = questionsInSection(sec).length}
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

      <!-- Cách làm bài -->
      <div class="space-y-2">
        <p class="text-[10px] font-black uppercase tracking-widest" style="color:#94a3b8;">Cách làm bài</p>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onclick={() => { studyMode = false; }}
            class="flex items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left transition"
            style="border-color:{!studyMode ? '#6366f1' : '#e2e8f0'};background:{!studyMode ? '#eef2ff' : '#ffffff'};"
          >
            <FileCheck size={18} style="color:{!studyMode ? '#4338ca' : '#94a3b8'};margin-top:2px;" />
            <span>
              <span class="block text-sm font-bold" style="color:{!studyMode ? '#4338ca' : '#475569'};">Thi thử</span>
              <span class="block text-xs" style="color:#64748b;">Xem đáp án sau khi nộp bài</span>
            </span>
          </button>
          <button
            onclick={() => { studyMode = true; }}
            class="flex items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left transition"
            style="border-color:{studyMode ? '#059669' : '#e2e8f0'};background:{studyMode ? '#ecfdf5' : '#ffffff'};"
          >
            <GraduationCap size={18} style="color:{studyMode ? '#047857' : '#94a3b8'};margin-top:2px;" />
            <span>
              <span class="block text-sm font-bold" style="color:{studyMode ? '#047857' : '#475569'};">Học</span>
              <span class="block text-xs" style="color:#64748b;">Chọn xong thấy ngay đúng/sai và giải thích</span>
            </span>
          </button>
        </div>
      </div>

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
    {#if mode === 'review'}
      <p class="mb-4 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold" style="background:#fffbeb;color:#b45309;">
        <Repeat size={14} /> Đang ôn {playQuestions.length} câu sai · không giới hạn thời gian
      </p>
    {/if}
    <QuizEngine
      quizId={quiz.id}
      {mode}
      sectionId={mode === 'review' ? null : selectedSec}
      questions={playQuestions}
      timeLimit={mode === 'review' ? 0 : timeLimitSecs}
      shuffleQuestions={shuffleQ}
      shuffleOptions={shuffleOpts}
      study={studyMode}
      {resume}
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

        <p class="mt-3 text-xs" style="color:{saveState === 'error' ? '#dc2626' : '#94a3b8'};">
          {#if saveState === 'saving'}Đang lưu kết quả…
          {:else if saveState === 'saved'}✓ Đã lưu vào lịch sử ôn thi
          {:else if saveState === 'guest'}Đăng nhập để lưu lịch sử ôn thi
          {:else if saveState === 'error'}Không lưu được kết quả: {saveMessage}
          {/if}
        </p>

        {#if mode === 'review' && wrongInResult.length === 0}
          <p class="mt-4 text-sm font-bold" style="color:#059669;">🎉 Bạn đã làm đúng hết các câu sai!</p>
        {/if}

        <div class="mt-6 flex flex-wrap justify-center gap-3">
          {#if wrongInResult.length > 0}
            <button
              onclick={() => startReview(wrongInResult)}
              class="flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition hover:opacity-90"
              style="background:#f59e0b;color:#ffffff;"
            >
              <Repeat size={16} /> Ôn lại {wrongInResult.length} câu sai
            </button>
          {/if}
          <!-- Fix nút Làm lại: text màu tối explicit -->
          <button
            onclick={() => { resultData = null; mode = 'normal'; reviewIds = []; phase = 'options'; }}
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
              <p class="whitespace-pre-line text-sm font-medium" style="color:#1e293b;">{q.content}</p>
              {#if !ans.is_correct}
                <p class="mt-2 text-xs" style="color:#64748b;">
                  Bạn chọn: <span class="font-bold" style="color:#dc2626;">{ans.chosenText.join('; ') || '(bỏ trống)'}</span>
                </p>
                <p class="mt-0.5 text-xs" style="color:#64748b;">
                  Đúng: <span class="font-bold" style="color:#059669;">{ans.correctText.join('; ')}</span>
                </p>
              {/if}
              {#if q.explanation}
                <p class="mt-2 whitespace-pre-line rounded-xl px-3 py-2 text-xs leading-relaxed" style="background:rgba(255,255,255,0.7);color:#334155;">
                  <span class="font-semibold">Giải thích:</span> {q.explanation}
                </p>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
</div>
