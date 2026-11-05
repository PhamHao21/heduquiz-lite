<!-- src/routes/quiz/[id]/+page.svelte -->
<script lang="ts">
  import { untrack } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import QuizEngine from '$lib/components/quiz/QuizEngine.svelte';
  import QuizCover from '$lib/components/quiz/QuizCover.svelte';
  import LikeButton from '$lib/components/social/LikeButton.svelte';
  import FollowButton from '$lib/components/social/FollowButton.svelte';
  import CommentSection from '$lib/components/social/CommentSection.svelte';
  import { goto } from '$app/navigation';
  import { saveQuiz } from '$lib/supabase/saveQuiz';
  import { quizToText } from '$lib/utils/exportText';
  import type { ParsedQuestion } from '$lib/utils/parser';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { answeredCount, clearProgress, loadProgress, type Answer, type AttemptMode, type QuizProgress } from '$lib/utils/attempt';
  import {
    Play, PlayCircle, RotateCcw, Pencil, Share2, Copy, Check, Lock, Globe, Printer, Repeat, GraduationCap,
    FileCheck, Shuffle, Timer as TimerIcon, ListChecks, Users, ArrowLeft, CheckCircle2, XCircle, MinusCircle, LibraryBig,
    Layers, CopyPlus
  } from 'lucide-svelte';

  const { data } = $props();
  // $derived để khi chuyển sang đề khác (cùng route /quiz/[id]) dữ liệu được cập nhật theo.
  const quiz      = $derived(data.quiz);
  const questions = $derived(data.questions);
  const history   = $derived(data.history);
  const isOwner   = $derived(data.isOwner);
  const review    = $derived(data.review);
  const owner     = $derived(data.owner);
  const social    = $derived(data.social);

  // ── Lưu bản sao đề của người khác vào Kho đề của mình ──
  let cloning = $state(false);
  async function cloneQuiz() {
    if (!page.data.profile) { goto(`/auth?next=${encodeURIComponent(`/quiz/${quiz.id}`)}`); return; }
    cloning = true;
    try {
      type Row = { content: string; options: { label: string; text: string; is_correct: boolean }[]; multi: boolean; explanation: string | null };
      const rows = questions as Row[];
      const parsed: ParsedQuestion[] = rows.map((q, i) => ({
        position: i + 1,
        content: q.content,
        options: q.options.map(o => ({ label: o.label, text: o.text, is_correct: o.is_correct })),
        multi: q.multi,
        explanation: q.explanation ?? undefined
      }));
      const id = await saveQuiz({
        title: `${quiz.title} (bản sao)`.slice(0, 200),
        subject: quiz.subject,
        rawText: quizToText(rows),
        isPublic: false,
        sections: (quiz.sections as unknown[] | null) ?? null,
        questions: parsed
      });
      toast.success('Đã lưu bản sao vào Kho đề của bạn');
      await goto(`/tao-de?edit=${id}`);
    } catch (e) {
      toast.error(`Không lưu được bản sao: ${e instanceof Error ? e.message : e}`);
    } finally {
      cloning = false;
    }
  }

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
  let resultFilter  = $state<'all' | 'wrong' | 'right'>('all');

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
      shareOpen = false;
      savedProgress = loadProgress(id);
    });
  });

  const sections   = $derived((quiz.sections as Section[] | null) ?? []);

  // Phạm vi "câu X → Y" của phần thi tính theo thứ tự câu trong đề (1..n), không theo
  // cột position, vì dữ liệu cũ có thể có position bị nhảy số khi đề từng có câu lỗi.
  function questionsInSection(sec: Section) {
    return questions.filter((_q: unknown, i: number) => i + 1 >= sec.from && i + 1 <= sec.to);
  }

  const activeQuestions = $derived.by(() => {
    if (!selectedSec) return questions;
    const sec = sections.find((s: Section) => s.id === selectedSec);
    return sec ? questionsInSection(sec) : questions;
  });

  const total  = $derived(questions.length);
  const score  = $derived(resultData?.answers.filter(a => a.is_correct).length ?? 0);
  const pct    = $derived(resultData && resultData.answers.length ? Math.round((score / resultData.answers.length) * 100) : 0);
  const blank  = $derived(resultData?.answers.filter(a => a.chosen.length === 0).length ?? 0);
  const grade  = $derived(
    pct >= 90 ? { text: 'Xuất sắc', tone: 'text-success' }
    : pct >= 75 ? { text: 'Tốt lắm', tone: 'text-success' }
    : pct >= 50 ? { text: 'Đạt', tone: 'text-warning' }
    : { text: 'Cần ôn thêm', tone: 'text-danger' }
  );

  async function handleComplete(answers: Answer[], timeSpent: number) {
    resultData = { answers, timeSpent };
    savedProgress = null;
    resume = null;
    resultFilter = 'all';
    phase = 'result';
    saveState = 'saving';
    saveMessage = '';
    window.scrollTo({ top: 0 });
    celebrate(answers);

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

  /** Pháo giấy khi đạt từ 80% (bỏ qua nếu người dùng bật giảm chuyển động) */
  async function celebrate(answers: Answer[]) {
    const ratio = answers.length ? answers.filter(a => a.is_correct).length / answers.length : 0;
    if (ratio < 0.8 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const { default: confetti } = await import('canvas-confetti');
    const colors = ['#2446e8', '#5c7cff', '#f26a1b', '#3fcf8e', '#f5b544'];
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.35 }, colors, disableForReducedMotion: true });
    setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { y: 0.3 }, colors, disableForReducedMotion: true }), 250);
  }

  /** Chia sẻ kết quả (bảng chia sẻ của điện thoại, hoặc copy đoạn văn) */
  async function shareResult() {
    if (!resultData) return;
    const text = `Mình vừa đạt ${score}/${resultData.answers.length} câu (${pct}%) đề "${quiz.title}" trên HeduQuiz. Thử sức nhé: ${shareUrl}`;
    if ('share' in navigator && matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share({ title: quiz.title, text }); return; } catch { /* huỷ → copy */ }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Đã copy kết quả, dán vào tin nhắn để khoe nhé');
    } catch {
      toast.error('Trình duyệt không cho copy, hãy thử lại');
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
    window.scrollTo({ top: 0 });
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
    window.scrollTo({ top: 0 });
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
    : activeQuestions
  );

  type QuestionRow = { id: string; content: string; explanation?: string | null };
  const questionById = $derived(new Map<string, QuestionRow>(questions.map((q: QuestionRow) => [q.id, q])));

  /** Câu cần ôn (sai ở lần gần nhất, theo lịch sử đã lưu) */
  const needsReview = $derived(review?.needsReview.filter(s => questionById.has(s.question_id)) ?? []);
  const reviewList  = $derived(showAllReview ? needsReview : needsReview.slice(0, 5));

  /** Câu sai trong lượt vừa nộp */
  const wrongInResult = $derived(resultData?.answers.filter(a => !a.is_correct).map(a => a.question_id) ?? []);
  const shownAnswers = $derived(
    (resultData?.answers ?? [])
      .map((a, i) => ({ a, i }))
      .filter(({ a }) => resultFilter === 'all' || (resultFilter === 'wrong') !== a.is_correct)
  );

  function formatTime(s: number) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = String(s % 60).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
  }
  const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN');

  // ── Chia sẻ đề ──
  const shareUrl   = $derived(`${page.url.origin}/quiz/${quiz.id}`);
  let shareOpen    = $state(false);
  let copied       = $state(false);
  let publishing   = $state(false);

  async function openShare() {
    // Điện thoại: dùng bảng chia sẻ của hệ điều hành (Zalo, Messenger…) nếu đề đã công khai.
    if (quiz.is_public && 'share' in navigator && matchMedia('(pointer: coarse)').matches) {
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
    toast.success('Đã copy link đề');
    setTimeout(() => { copied = false; }, 2000);
  }

  async function makePublic() {
    publishing = true;
    try {
      const res = await fetch('/api/quizzes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: quiz.id, is_public: true })
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? `Lỗi ${res.status}`);
      await invalidateAll();
      toast.success('Đề đã chuyển sang công khai');
    } catch (e) {
      toast.error(`Không đổi được chế độ: ${e instanceof Error ? e.message : e}`);
    } finally {
      publishing = false;
    }
  }

  const ogDescription = $derived(
    `${total} câu hỏi${quiz.subject ? ` · ${quiz.subject}` : ''}. Ôn thi trắc nghiệm miễn phí trên HeduQuiz.`
  );

  const TIME_OPTIONS = [
    { label: 'Không giới hạn', value: 0 },
    { label: '15 phút', value: 15 },
    { label: '30 phút', value: 30 },
    { label: '45 phút', value: 45 },
    { label: '60 phút', value: 60 },
    { label: '90 phút', value: 90 }
  ];

  // Vòng điểm ở màn hình kết quả
  const RING = 2 * Math.PI * 52;
</script>

<svelte:head>
  <title>{quiz.title} · HeduQuiz</title>
  <meta name="description" content={ogDescription} />
  <!-- Thẻ xem trước khi gửi link qua Messenger, Zalo, Facebook… -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="HeduQuiz" />
  <meta property="og:title" content={quiz.title} />
  <meta property="og:description" content={ogDescription} />
  <meta property="og:url" content={shareUrl} />
  <meta name="twitter:card" content="summary" />
</svelte:head>

<div class="mx-auto max-w-5xl">

<!-- ═════════════ GIỚI THIỆU ═════════════ -->
{#if phase === 'intro'}
  <div class="mx-auto max-w-3xl space-y-5">
    <section class="card rise-in overflow-hidden">
      <QuizCover id={quiz.id} title={quiz.title} class="h-28 sm:h-36" />
      <div class="p-6 sm:p-8">
      <div class="flex flex-wrap items-center gap-2">
        {#if quiz.subject}<span class="tag">{quiz.subject}</span>{/if}
        {#if isOwner}
          <span class="tag {quiz.is_public ? 'bg-success-soft text-success' : ''}">
            {#if quiz.is_public}<Globe size={12} /> Công khai{:else}<Lock size={12} /> Riêng tư{/if}
          </span>
        {/if}
      </div>
      <h1 class="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{quiz.title}</h1>
      {#if quiz.description}<p class="mt-2 text-muted">{quiz.description}</p>{/if}

      <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
        <span class="inline-flex items-center gap-1.5"><ListChecks size={16} /> {total} câu hỏi</span>
        <span class="inline-flex items-center gap-1.5"><Users size={16} /> {quiz.play_count} lượt ôn</span>
      </div>

      {#if owner}
        <div class="mt-5 flex items-center gap-3 rounded-xl bg-sunken px-4 py-3">
          <a href="/u/{owner.username}"><Avatar name={owner.display_name ?? owner.username} src={owner.avatar_url} size={40} /></a>
          <a href="/u/{owner.username}" class="min-w-0 flex-1">
            <span class="block truncate text-sm font-bold hover:underline">{owner.display_name ?? owner.username}</span>
            <span class="block truncate text-xs text-muted">@{owner.username}</span>
          </a>
          {#if !isOwner && social.available}<FollowButton userId={quiz.owner_id} following={social.followingOwner} size="sm" />{/if}
        </div>
      {/if}

      {#if savedProgress}
        <div class="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-accent/30 bg-accent-soft p-4">
          <PlayCircle size={22} class="shrink-0 text-accent" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-accent-ink">
              {savedProgress.mode === 'review' ? 'Bạn có lượt ôn câu sai đang làm dở' : 'Bạn có bài đang làm dở'}
            </p>
            <p class="text-xs text-accent-ink/80">
              Đã làm {answeredCount(savedProgress)}/{savedProgress.order.length} câu{savedProgress.endsAt
                ? `, ${savedProgress.endsAt > Date.now() ? `còn ${formatTime(Math.ceil((savedProgress.endsAt - Date.now()) / 1000))}` : 'đã hết giờ'}`
                : ''}
            </p>
          </div>
          <div class="flex gap-2">
            <button onclick={discardProgress} class="btn btn-ghost btn-sm">Bỏ bài này</button>
            <button onclick={continueQuiz} class="btn btn-primary btn-sm">Làm tiếp</button>
          </div>
        </div>
      {/if}

      <div class="mt-6 flex flex-wrap gap-2">
        <button onclick={() => { phase = 'options'; }} disabled={total === 0} class="btn btn-primary btn-lg flex-1 sm:flex-none">
          <Play size={18} /> Bắt đầu ôn thi
        </button>
        {#if social.available}<LikeButton quizId={quiz.id} count={social.likeCount} liked={social.liked} />{/if}
        <button onclick={openShare} class="btn btn-secondary btn-lg btn-icon" aria-label="Chia sẻ đề" title="Chia sẻ đề" aria-expanded={shareOpen}><Share2 size={18} /></button>
        {#if isOwner}
          <a href="/tao-de?edit={quiz.id}" class="btn btn-secondary btn-lg btn-icon" aria-label="Sửa đề" title="Sửa đề"><Pencil size={18} /></a>
        {/if}
      </div>
      <div class="mt-3 flex flex-wrap gap-x-1 gap-y-1">
        <a href="/quiz/{quiz.id}/the-ghi-nho" class="btn btn-ghost btn-sm" class:pointer-events-none={total === 0}><Layers size={15} /> Thẻ ghi nhớ</a>
        <a href="/quiz/{quiz.id}/in" class="btn btn-ghost btn-sm"><Printer size={15} /> In / PDF</a>
        {#if !isOwner}
          <button onclick={cloneQuiz} disabled={cloning || total === 0} class="btn btn-ghost btn-sm"><CopyPlus size={15} /> {cloning ? 'Đang lưu…' : 'Lưu bản sao'}</button>
        {/if}
      </div>
      {#if total === 0}<p class="mt-3 text-sm text-warning">Đề này chưa có câu hỏi nào.</p>{/if}

      {#if shareOpen}
        <div class="rise-in mt-4 rounded-xl border border-line bg-sunken p-4">
          {#if quiz.is_public}
            <p class="mb-3 flex items-center gap-1.5 text-sm font-semibold text-success">
              <Globe size={15} /> Đề công khai. Ai có link đều ôn được, không cần đăng nhập.
            </p>
          {:else}
            <p class="mb-3 flex items-center gap-1.5 text-sm font-semibold text-warning">
              <Lock size={15} /> Đề đang ở chế độ riêng tư. Người khác mở link sẽ không xem được.
            </p>
          {/if}
          <div class="flex gap-2">
            <label class="min-w-0 flex-1">
              <span class="sr-only">Link đề</span>
              <input id="share-url" readonly value={shareUrl} onfocus={(e) => e.currentTarget.select()} class="input" />
            </label>
            <button onclick={copyLink} class="btn btn-primary shrink-0">
              {#if copied}<Check size={16} /> Đã copy{:else}<Copy size={16} /> Copy link{/if}
            </button>
          </div>
          {#if !quiz.is_public && isOwner}
            <button onclick={makePublic} disabled={publishing} class="btn btn-secondary btn-sm mt-3">
              <Globe size={14} /> {publishing ? 'Đang chuyển…' : 'Chuyển sang công khai'}
            </button>
          {/if}
        </div>
      {/if}
      </div>
    </section>

    {#if needsReview.length > 0}
      <section class="card rise-in rise-in-delay-1 p-6">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="flex items-center gap-2 font-bold"><Repeat size={18} class="text-warning" /> Câu cần ôn lại</h2>
            <p class="mt-1 text-sm text-muted">
              {needsReview.length} câu bạn làm sai ở lần gần nhất. Ôn lại làm đúng thì câu tự rời khỏi danh sách.
            </p>
          </div>
          <button onclick={() => startReview(needsReview.map(s => s.question_id))} class="btn btn-primary btn-sm shrink-0">
            <Repeat size={15} /> Ôn {needsReview.length} câu sai
          </button>
        </div>
        <ul class="mt-4 space-y-2">
          {#each reviewList as stat (stat.question_id)}
            <li class="flex items-start justify-between gap-3 rounded-xl bg-sunken px-4 py-3">
              <span class="line-clamp-2 whitespace-pre-line text-sm">{questionById.get(stat.question_id)?.content}</span>
              <span class="shrink-0 text-xs font-semibold text-warning">Sai {stat.wrong}/{stat.seen} lần</span>
            </li>
          {/each}
        </ul>
        {#if needsReview.length > 5}
          <button onclick={() => { showAllReview = !showAllReview; }} class="mt-3 text-sm font-semibold text-accent hover:underline">
            {showAllReview ? 'Thu gọn' : `Xem tất cả ${needsReview.length} câu`}
          </button>
        {/if}
      </section>
    {:else if review && review.attemptsCounted > 0}
      <p class="flex items-center gap-2 px-1 text-sm text-success"><CheckCircle2 size={16} /> Bạn đã làm đúng tất cả các câu ở lần làm gần nhất.</p>
    {/if}

    {#if history.length > 0}
      <section class="card rise-in rise-in-delay-2 p-6">
        <h2 class="font-bold">Lịch sử ôn thi</h2>
        <ul class="mt-3 divide-y divide-line">
          {#each history as h (h.id)}
            {@const p = h.total ? Math.round((h.score / h.total) * 100) : 0}
            <li class="flex items-center gap-4 py-3 text-sm">
              <span class="text-muted">{formatDate(h.completed_at)}</span>
              {#if h.time_spent}<span class="hidden text-faint sm:inline">{formatTime(h.time_spent)}</span>{/if}
              <span class="ml-auto font-bold tabular-nums">{h.score}/{h.total}</span>
              <span class="w-12 text-right text-xs font-bold tabular-nums {p >= 75 ? 'text-success' : p >= 50 ? 'text-warning' : 'text-danger'}">{p}%</span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if social.available}
      <CommentSection quizId={quiz.id} quizOwnerId={quiz.owner_id} comments={social.comments} />
    {/if}
  </div>

<!-- ═════════════ TUỲ CHỌN ═════════════ -->
{:else if phase === 'options'}
  <section class="card rise-in mx-auto max-w-2xl space-y-7 p-6 sm:p-8">
    <div>
      <button onclick={() => { phase = 'intro'; }} class="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft size={16} /> {quiz.title}
      </button>
      <h1 class="mt-2 text-xl font-extrabold tracking-tight">Tuỳ chọn ôn thi</h1>
    </div>

    <fieldset>
      <legend class="label">Cách làm bài</legend>
      <div class="grid gap-2 sm:grid-cols-2">
        <button onclick={() => { studyMode = false; }} aria-pressed={!studyMode}
          class="flex items-start gap-3 rounded-xl border-2 p-4 text-left transition {!studyMode ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong'}">
          <FileCheck size={20} class={!studyMode ? 'text-accent' : 'text-muted'} />
          <span>
            <span class="block font-semibold">Thi thử</span>
            <span class="text-sm text-muted">Xem đáp án sau khi nộp bài</span>
          </span>
        </button>
        <button onclick={() => { studyMode = true; }} aria-pressed={studyMode}
          class="flex items-start gap-3 rounded-xl border-2 p-4 text-left transition {studyMode ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong'}">
          <GraduationCap size={20} class={studyMode ? 'text-accent' : 'text-muted'} />
          <span>
            <span class="block font-semibold">Học</span>
            <span class="text-sm text-muted">Chọn xong thấy ngay đúng sai và giải thích</span>
          </span>
        </button>
      </div>
    </fieldset>

    {#if sections.length > 0}
      <fieldset>
        <legend class="label">Phần thi</legend>
        <div class="space-y-2">
          <button onclick={() => { selectedSec = null; }} aria-pressed={selectedSec === null}
            class="flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition {selectedSec === null ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong'}">
            Toàn bộ đề <span class="font-medium text-muted">{total} câu</span>
          </button>
          {#each sections as sec (sec.id)}
            {@const cnt = questionsInSection(sec).length}
            <button onclick={() => { selectedSec = sec.id; }} aria-pressed={selectedSec === sec.id}
              class="flex w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition {selectedSec === sec.id ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong'}">
              <span class="truncate">{sec.name}</span>
              <span class="shrink-0 font-medium text-muted">câu {sec.from}-{sec.to}, {cnt} câu</span>
            </button>
          {/each}
        </div>
      </fieldset>
    {/if}

    <fieldset>
      <legend class="label">Xáo trộn</legend>
      <div class="flex flex-wrap gap-2">
        <button onclick={() => { shuffleQ = !shuffleQ; }} aria-pressed={shuffleQ} class="chip {shuffleQ ? 'chip-active' : ''}">
          <Shuffle size={14} /> Đảo câu hỏi
        </button>
        <button onclick={() => { shuffleOpts = !shuffleOpts; }} aria-pressed={shuffleOpts} class="chip {shuffleOpts ? 'chip-active' : ''}">
          <Shuffle size={14} /> Đảo đáp án
        </button>
      </div>
    </fieldset>

    <fieldset>
      <legend class="label flex items-center gap-1.5"><TimerIcon size={15} /> Giới hạn thời gian</legend>
      <div class="flex flex-wrap gap-2">
        {#each TIME_OPTIONS as opt (opt.value)}
          <button onclick={() => { timeLimitMins = opt.value; }} aria-pressed={timeLimitMins === opt.value}
            class="chip {timeLimitMins === opt.value ? 'chip-active' : ''}">{opt.label}</button>
        {/each}
      </div>
    </fieldset>

    <div class="flex gap-2 border-t border-line pt-6">
      <button onclick={() => { phase = 'intro'; }} class="btn btn-secondary">Quay lại</button>
      <button onclick={startQuiz} disabled={activeQuestions.length === 0} class="btn btn-primary flex-1">
        <Play size={16} /> Bắt đầu ({activeQuestions.length} câu)
      </button>
    </div>
  </section>

<!-- ═════════════ LÀM BÀI ═════════════ -->
{:else if phase === 'playing'}
  <div class="mb-4 flex flex-wrap items-center gap-3">
    <h1 class="min-w-0 flex-1 truncate text-sm font-semibold text-muted">{quiz.title}</h1>
    {#if mode === 'review'}
      <span class="tag bg-warning-soft text-warning"><Repeat size={12} /> Ôn {playQuestions.length} câu sai, không giới hạn giờ</span>
    {/if}
  </div>
  <QuizEngine
    quizId={quiz.id}
    {mode}
    sectionId={mode === 'review' ? null : selectedSec}
    questions={playQuestions}
    timeLimit={mode === 'review' ? 0 : timeLimitMins * 60}
    shuffleQuestions={shuffleQ}
    shuffleOptions={shuffleOpts}
    study={studyMode}
    {resume}
    onComplete={handleComplete}
  />

<!-- ═════════════ KẾT QUẢ ═════════════ -->
{:else if phase === 'result' && resultData}
  <div class="mx-auto max-w-3xl space-y-5">
    <section class="card rise-in p-6 sm:p-8">
      <div class="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div class="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 120 120" class="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--sunken)" stroke-width="10" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--accent)" stroke-width="10" stroke-linecap="round"
              stroke-dasharray={RING} stroke-dashoffset={RING * (1 - pct / 100)} class="transition-[stroke-dashoffset] duration-700" />
          </svg>
          <span class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-3xl font-extrabold tabular-nums">{pct}%</span>
          </span>
        </div>
        <div class="text-center sm:text-left">
          <p class="text-2xl font-extrabold {grade.tone}">{grade.text}</p>
          <p class="mt-1 text-muted">{score}/{resultData.answers.length} câu đúng, làm trong {formatTime(resultData.timeSpent)}</p>
          <p class="mt-2 text-xs {saveState === 'error' ? 'text-danger' : 'text-faint'}">
            {#if saveState === 'saving'}Đang lưu kết quả…
            {:else if saveState === 'saved'}Đã lưu vào lịch sử ôn thi
            {:else if saveState === 'guest'}<a href="/auth?next=/quiz/{quiz.id}" class="font-semibold text-accent hover:underline">Đăng nhập</a> để lưu lịch sử và ôn lại câu sai sau này
            {:else if saveState === 'error'}Không lưu được kết quả: {saveMessage}
            {/if}
          </p>
          {#if mode === 'review' && wrongInResult.length === 0}
            <p class="mt-2 text-sm font-semibold text-success">Bạn đã làm đúng hết các câu sai.</p>
          {/if}
        </div>
      </div>

      <div class="mt-6 grid grid-cols-3 gap-2 text-center">
        <div class="rounded-xl bg-success-soft p-3">
          <p class="text-xl font-extrabold tabular-nums text-success">{score}</p>
          <p class="text-xs font-medium text-muted">Đúng</p>
        </div>
        <div class="rounded-xl bg-danger-soft p-3">
          <p class="text-xl font-extrabold tabular-nums text-danger">{resultData.answers.length - score - blank}</p>
          <p class="text-xs font-medium text-muted">Sai</p>
        </div>
        <div class="rounded-xl bg-sunken p-3">
          <p class="text-xl font-extrabold tabular-nums">{blank}</p>
          <p class="text-xs font-medium text-muted">Bỏ trống</p>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap gap-2">
        {#if wrongInResult.length > 0}
          <button onclick={() => startReview(wrongInResult)} class="btn btn-primary"><Repeat size={16} /> Ôn lại {wrongInResult.length} câu sai</button>
        {/if}
        <button onclick={() => { resultData = null; mode = 'normal'; reviewIds = []; phase = 'options'; }} class="btn btn-secondary">
          <RotateCcw size={16} /> Làm lại
        </button>
        {#if quiz.is_public}
          <button onclick={shareResult} class="btn btn-secondary"><Share2 size={16} /> Chia sẻ kết quả</button>
        {/if}
        <a href={page.data.profile ? '/kho-de' : '/kham-pha'} class="btn btn-ghost">
          <LibraryBig size={16} /> {page.data.profile ? 'Về Kho đề' : 'Đề khác'}
        </a>
      </div>
    </section>

    <section class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-bold">Chi tiết đáp án</h2>
        <div class="segmented" role="group" aria-label="Lọc câu trả lời">
          <button aria-pressed={resultFilter === 'all'} onclick={() => { resultFilter = 'all'; }}>Tất cả {resultData.answers.length}</button>
          <button aria-pressed={resultFilter === 'wrong'} onclick={() => { resultFilter = 'wrong'; }}>Sai {resultData.answers.length - score}</button>
          <button aria-pressed={resultFilter === 'right'} onclick={() => { resultFilter = 'right'; }}>Đúng {score}</button>
        </div>
      </div>

      {#each shownAnswers as { a, i } (a.question_id)}
        {@const q = questionById.get(a.question_id)}
        {#if q}
          <article class="card p-5">
            <div class="flex items-start gap-3">
              {#if a.is_correct}
                <CheckCircle2 size={20} class="mt-0.5 shrink-0 text-success" />
              {:else if a.chosen.length === 0}
                <MinusCircle size={20} class="mt-0.5 shrink-0 text-faint" />
              {:else}
                <XCircle size={20} class="mt-0.5 shrink-0 text-danger" />
              {/if}
              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold text-faint">Câu {i + 1}</p>
                <p class="mt-0.5 whitespace-pre-line font-medium">{q.content}</p>
                {#if !a.is_correct}
                  <dl class="mt-3 grid gap-1 text-sm">
                    <div class="flex gap-2"><dt class="w-20 shrink-0 text-muted">Bạn chọn</dt><dd class="font-semibold text-danger">{a.chosenText.join('; ') || 'Bỏ trống'}</dd></div>
                    <div class="flex gap-2"><dt class="w-20 shrink-0 text-muted">Đáp án</dt><dd class="font-semibold text-success">{a.correctText.join('; ')}</dd></div>
                  </dl>
                {:else}
                  <p class="mt-2 text-sm text-success">{a.correctText.join('; ')}</p>
                {/if}
                {#if q.explanation}
                  <p class="mt-3 whitespace-pre-line rounded-xl bg-sunken px-3.5 py-2.5 text-sm leading-relaxed">
                    <span class="font-semibold">Giải thích:</span> {q.explanation}
                  </p>
                {/if}
              </div>
            </div>
          </article>
        {/if}
      {:else}
        <p class="rounded-2xl border border-dashed border-line-strong py-8 text-center text-sm text-muted">
          {resultFilter === 'wrong' ? 'Không có câu sai nào.' : 'Không có câu đúng nào.'}
        </p>
      {/each}
    </section>
  </div>
{/if}
</div>
