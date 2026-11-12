<!-- src/routes/tao-de/+page.svelte -->
<script lang="ts">
  import { untrack } from 'svelte';
  import { parseQuizText } from '$lib/utils/quizParser';
  import { saveQuiz } from '$lib/supabase/saveQuiz';
  import {
    Eye, Globe, Lock, ChevronLeft, ChevronRight, ChevronDown, Save, Plus, Trash2, LayoutList, FileUp, ArrowLeft,
    AlertCircle, CheckCircle2, BookOpenText, Wand2
  } from 'lucide-svelte';
  import { IMPORT_ACCEPT, ImportError, importQuizFile } from '$lib/import/extract';
  import { goto, beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import type { ParseErrorCode } from '$lib/utils/parser';

  const { data } = $props();
  const editQuiz = $derived(data.editQuiz);
  const isEdit   = $derived(!!editQuiz);


  let quizTitle      = $state('');
  let educationLevel = $state('Đại học');
  let isPublic       = $state(false);
  let quizRawText    = $state('');
  let currentIndex   = $state(0);
  let saving         = $state(false);
  let saveError      = $state('');

  interface Section { id: string; name: string; from: number; to: number }
  let sections       = $state<Section[]>([]);
  let showSections   = $state(false);

  let showSyntax     = $state(false);
  /** nội dung lúc mở trang, để biết đã sửa mà chưa lưu hay chưa */
  let baseline       = $state({ title: '', raw: '' });
  let saved          = false;

  // Nạp dữ liệu đề vào form khi mở trang / đổi đề. Chỉ phụ thuộc vào editQuiz; phần còn lại
  // chạy trong untrack để effect không tự kích hoạt lại khi chính nó ghi vào các biến của form.
  $effect(() => {
    const q = editQuiz;
    untrack(() => {
      quizTitle      = q?.title      ?? '';
      educationLevel = q?.subject    ?? 'Đại học';
      isPublic       = q?.is_public  ?? false;
      quizRawText    = q?.raw_text   ?? '';
      sections       = (q as { sections: Section[] } | null)?.sections ?? [];
      showSections   = sections.length > 0;
      currentIndex   = 0;
      baseline       = { title: quizTitle, raw: quizRawText };
    });
  });

  const dirty = $derived(quizTitle !== baseline.title || quizRawText !== baseline.raw);

  // Cảnh báo khi rời trang mà chưa lưu (chuyển trang trong web hoặc đóng tab).
  beforeNavigate(({ cancel, type }) => {
    if (!dirty || saved || saving) return;
    if (type === 'leave') { cancel(); return; } // trình duyệt tự hiện hộp thoại "Rời trang?"
    if (!confirm('Bạn có thay đổi chưa lưu. Rời trang này?')) cancel();
  });

  /** Vào từ menu "Nhập từ file": làm nổi phần nhập file */
  const importFocus = $derived(page.url.searchParams.get('nhap') === 'file' && !quizRawText.trim());

  const ERROR_TEXT: Record<ParseErrorCode, string> = {
    empty_question: 'Thiếu nội dung câu hỏi',
    no_answers: 'Chưa có đáp án',
    insufficient_answers: 'Cần ít nhất 2 đáp án',
    missing_correct_answer: 'Chưa đánh dấu đáp án đúng'
  };

  const EDITOR_PLACEHOLDER = 'Câu hỏi đầu tiên?\n*A. Đáp án đúng\nB. Đáp án sai\nC. Đáp án sai\nD. Đáp án sai\n> Giải thích (không bắt buộc)\n\nCâu hỏi tiếp theo?';

  const SAMPLE = `Thủ đô của Việt Nam là thành phố nào?
A. Huế
*B. Hà Nội
C. Đà Nẵng
D. TP. Hồ Chí Minh
> Hà Nội là thủ đô của nước Cộng hoà xã hội chủ nghĩa Việt Nam.

Chọn các số nguyên tố:
**A. 2
B. 4
**C. 5
D. 9

Nước sôi ở bao nhiêu độ C (áp suất 1 atm)?
A. 90
B. 100
C. 110
Đáp án: B`;

  const levels = ['Tiểu học', 'THCS', 'THPT', 'Cao đẳng', 'Đại học'];

  // ── Nhập đề từ file Word / PDF / TXT (đọc ngay trên trình duyệt) ──
  let importInput  = $state<HTMLInputElement>();
  let importing    = $state(false);
  let importNotice = $state<{ kind: 'ok' | 'error'; text: string } | null>(null);

  async function handleImport(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // cho phép chọn lại cùng file
    if (!file) return;

    importing = true;
    importNotice = null;
    try {
      const result = await importQuizFile(file);
      const imported = parseQuizText(result.text).stats;

      quizRawText = quizRawText.trim() ? `${quizRawText.trimEnd()}\n\n${result.text}` : result.text;
      if (!quizTitle.trim()) quizTitle = file.name.replace(/\.[^.]+$/, '');

      const parts = [`Đã nhập ${imported.valid} câu hợp lệ từ "${file.name}"`];
      if (imported.errorCount > 0) parts.push(`${imported.errorCount} câu cần sửa (đánh dấu đỏ)`);
      if (result.emphasisMarked > 0) parts.push(`${result.emphasisMarked} câu nhận đáp án đúng từ chữ in đậm/gạch chân`);
      importNotice = { kind: 'ok', text: `${parts.join(', ')}. Hãy kiểm tra lại phần xem trước trước khi lưu.` };
    } catch (err) {
      importNotice = {
        kind: 'error',
        text: err instanceof ImportError ? err.message : `Không đọc được file: ${err instanceof Error ? err.message : err}`
      };
    } finally {
      importing = false;
    }
  }

  const parsed      = $derived(parseQuizText(quizRawText));
  const questions   = $derived(parsed.questions);
  const stats       = $derived(parsed.stats);
  const canSave     = $derived(quizTitle.trim().length > 0 && stats.valid > 0 && !saving);

  $effect(() => {
    if (questions.length > 0 && currentIndex >= questions.length) {
      currentIndex = questions.length - 1;
    }
  });

  function addSection() {
    const total = stats.valid || 0;
    if (total === 0) return;
    const id = crypto.randomUUID();
    const prev = sections[sections.length - 1];
    const from = prev ? prev.to + 1 : 1;
    const to   = Math.min(from + 39, total);
    sections = [...sections, { id, name: `Phần ${sections.length + 1}`, from, to }];
  }

  function removeSection(id: string) {
    sections = sections.filter(s => s.id !== id);
  }

  function validateSections(): string | null {
    for (const s of sections) {
      if (!s.name.trim()) return 'Tên phần không được để trống';
      if (s.from < 1 || s.to < s.from) return `Phần "${s.name}": phạm vi câu hỏi không hợp lệ`;
      if (s.to > stats.valid) return `Phần "${s.name}": câu ${s.to} vượt quá tổng số câu (${stats.valid})`;
    }

    for (let i = 0; i < sections.length; i++) {
      for (let j = i + 1; j < sections.length; j++) {
        const a = sections[i], b = sections[j];
        if (!(a.to < b.from || b.to < a.from)) return `Phần "${a.name}" và "${b.name}" bị trùng phạm vi câu hỏi`;
      }
    }
    return null;
  }

  async function handleSave() {
    if (!canSave || !page.data.profile) return;

    const sectionErr = validateSections();
    if (sectionErr) { saveError = sectionErr; return; }

    saving = true; saveError = '';

    try {
      const id = await saveQuiz({
        id: isEdit && editQuiz ? editQuiz.id : null,
        title: quizTitle,
        subject: educationLevel,
        rawText: quizRawText,
        isPublic,
        sections,
        questions
      });
      saved = true;
      goto(`/quiz/${id}`);
    } catch (e: unknown) {
      saveError = e instanceof Error ? e.message : 'Lỗi không xác định';
      saving = false;
    }
  }
</script>

<svelte:head><title>{isEdit ? 'Sửa đề' : 'Tạo đề'} · HeduQuiz</title></svelte:head>

<div class="space-y-5">
  <!-- Tiêu đề trang + thông tin đề + lưu -->
  <div class="flex flex-wrap items-center gap-3">
    <a href={isEdit && editQuiz ? `/quiz/${editQuiz.id}` : '/kho-de'} class="btn btn-ghost btn-icon" aria-label="Quay lại"><ArrowLeft size={18} /></a>
    <h1 class="text-2xl font-extrabold tracking-tight">{isEdit ? 'Sửa đề' : 'Tạo đề mới'}</h1>
    {#if dirty}<span class="tag bg-warning-soft text-warning">Chưa lưu</span>{/if}
  </div>

  <section class="card grid gap-4 p-5 md:grid-cols-[1fr_180px_auto_auto] md:items-end">
    <div>
      <label class="label" for="quizTitle">Tên đề</label>
      <input id="quizTitle" bind:value={quizTitle} placeholder="Ví dụ: Sinh học 12, chương Di truyền" class="input" maxlength="200" />
    </div>
    <div>
      <label class="label" for="level">Trình độ</label>
      <select id="level" bind:value={educationLevel} class="input">
        {#each levels as l (l)}<option value={l}>{l}</option>{/each}
      </select>
    </div>
    <div>
      <span class="label">Hiển thị</span>
      <div class="segmented" role="group" aria-label="Chế độ hiển thị">
        <button aria-pressed={!isPublic} onclick={() => { isPublic = false; }}><Lock size={14} /> Riêng tư</button>
        <button aria-pressed={isPublic} onclick={() => { isPublic = true; }}><Globe size={14} /> Công khai</button>
      </div>
    </div>
    <button disabled={!canSave} onclick={handleSave} class="btn btn-primary">
      <Save size={16} /> {saving ? 'Đang lưu…' : isEdit ? 'Lưu thay đổi' : `Lưu đề (${stats.valid} câu)`}
    </button>
  </section>

  {#if saveError}
    <p class="flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger" role="alert"><AlertCircle size={16} /> {saveError}</p>
  {/if}

  <!-- Chia phần thi -->
  {#if stats.valid > 0}
    <section class="card overflow-hidden">
      <button onclick={() => { showSections = !showSections; }} aria-expanded={showSections}
        class="flex w-full items-center gap-2.5 px-5 py-4 text-left hover:bg-sunken">
        <LayoutList size={18} class="text-accent" />
        <span class="font-semibold">Chia phần thi</span>
        {#if sections.length > 0}<span class="tag bg-accent-soft text-accent-ink">{sections.length} phần</span>{/if}
        <span class="ml-auto hidden text-sm text-muted sm:inline">Ví dụ 200 câu chia 5 phần, khi ôn chọn từng phần</span>
        <ChevronDown size={18} class="text-muted transition {showSections ? 'rotate-180' : ''}" />
      </button>
      {#if showSections}
        <div class="space-y-2 border-t border-line p-5">
          {#each sections as sec, i (sec.id)}
            <div class="flex flex-wrap items-center gap-3 rounded-xl bg-sunken px-4 py-3">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-bold text-accent-ink">{i + 1}</span>
              <label class="min-w-[8rem] flex-1">
                <span class="sr-only">Tên phần {i + 1}</span>
                <input bind:value={sec.name} placeholder="Tên phần" class="w-full bg-transparent text-sm font-semibold outline-none" />
              </label>
              <span class="flex items-center gap-1.5 text-sm text-muted">
                Câu
                <input type="number" min="1" max={stats.valid} bind:value={sec.from} aria-label="Từ câu" class="input w-16 px-2 py-1.5 text-center" />
                đến
                <input type="number" min="1" max={stats.valid} bind:value={sec.to} aria-label="Đến câu" class="input w-16 px-2 py-1.5 text-center" />
              </span>
              <button onclick={() => removeSection(sec.id)} class="btn btn-ghost btn-icon hover:text-danger" aria-label="Xoá phần {i + 1}"><Trash2 size={15} /></button>
            </div>
          {/each}
          <button onclick={addSection} class="btn btn-secondary w-full border-dashed"><Plus size={15} /> Thêm phần</button>
        </div>
      {/if}
    </section>
  {/if}

  <div class="grid items-start gap-5 lg:grid-cols-2">
    <!-- Soạn đề -->
    <section class="space-y-3">
      <div class="card p-4 {importFocus ? 'ring-2 ring-accent' : ''}">
        <input bind:this={importInput} type="file" accept={IMPORT_ACCEPT} class="hidden" onchange={handleImport} />
        <div class="flex flex-wrap items-center gap-2">
          <button onclick={() => importInput?.click()} disabled={importing} class="btn btn-secondary btn-sm">
            <FileUp size={15} /> {importing ? 'Đang đọc file…' : 'Nhập từ file'}
          </button>
          <button onclick={() => { showSyntax = !showSyntax; }} aria-expanded={showSyntax} class="btn btn-ghost btn-sm">
            <BookOpenText size={15} /> Cú pháp
          </button>
          {#if !quizRawText.trim()}
            <button onclick={() => { quizRawText = SAMPLE; }} class="btn btn-ghost btn-sm"><Wand2 size={15} /> Chèn ví dụ</button>
          {/if}
          <span class="ml-auto text-xs text-faint">Word, PDF, TXT</span>
        </div>
        {#if importFocus}
          <p class="mt-3 text-sm text-muted">Chọn file Word (.docx), PDF hoặc TXT. Đáp án in đậm, gạch chân hoặc dòng "Đáp án: B" được nhận tự động.</p>
        {/if}
        {#if importNotice}
          <p class="mt-3 rounded-xl px-3.5 py-2.5 text-sm {importNotice.kind === 'ok' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}" role="status">
            {importNotice.text}
          </p>
        {/if}
        {#if showSyntax}
          <dl class="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-line pt-4 text-sm">
            <dt><code class="rounded bg-sunken px-1.5 py-0.5 font-mono text-xs">*A. ...</code></dt><dd class="text-muted">Đáp án đúng</dd>
            <dt><code class="rounded bg-sunken px-1.5 py-0.5 font-mono text-xs">**A. ...</code></dt><dd class="text-muted">Câu nhiều đáp án đúng</dd>
            <dt><code class="rounded bg-sunken px-1.5 py-0.5 font-mono text-xs">Đáp án: B</code></dt><dd class="text-muted">Thay cho dấu * (đặt sau các đáp án)</dd>
            <dt><code class="rounded bg-sunken px-1.5 py-0.5 font-mono text-xs">&gt; ...</code></dt><dd class="text-muted">Giải thích đáp án</dd>
            <dt><span class="text-xs font-semibold">Dòng trống</span></dt><dd class="text-muted">Sang câu mới</dd>
            <dt><code class="rounded bg-sunken px-1.5 py-0.5 font-mono text-xs">&lt;br /&gt;</code></dt><dd class="text-muted">Xuống dòng trong câu hỏi</dd>
            <dt><code class="rounded bg-sunken px-1.5 py-0.5 font-mono text-xs">'Phần 2</code></dt><dd class="text-muted">Mở phần thi mới</dd>
          </dl>
          <a href="/huong-dan#cu-phap" class="mt-3 inline-block text-sm font-semibold text-accent hover:underline">Xem hướng dẫn đầy đủ</a>
        {/if}
      </div>

      <label class="block">
        <span class="sr-only">Nội dung đề</span>
        <textarea bind:value={quizRawText} spellcheck="false"
          placeholder={EDITOR_PLACEHOLDER}
          class="input h-[60vh] min-h-[420px] resize-y p-4 font-mono text-[13px] leading-relaxed"></textarea>
      </label>
    </section>

    <!-- Xem trước -->
    <section class="space-y-3 lg:sticky lg:top-24">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="flex items-center gap-2 font-bold"><Eye size={18} class="text-accent" /> Xem trước</h2>
        {#if stats.total > 0}
          <span class="tag bg-success-soft text-success"><CheckCircle2 size={12} /> {stats.valid} câu hợp lệ</span>
          {#if stats.errorCount > 0}<span class="tag bg-danger-soft text-danger"><AlertCircle size={12} /> {stats.errorCount} câu cần sửa</span>{/if}
        {/if}
      </div>

      {#if questions.length === 0}
        <div class="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong px-6 text-center">
          <BookOpenText size={28} class="text-faint" />
          <p class="mt-3 font-semibold">Chưa có câu hỏi nào</p>
          <p class="mt-1 text-sm text-muted">Nhập nội dung bên trái hoặc nhập từ file, phần xem trước sẽ hiện ở đây.</p>
        </div>
      {:else}
        {#if stats.errorCount > 0}
          <div class="card max-h-40 overflow-y-auto p-3">
            <ul class="space-y-1 text-sm">
              {#each questions as q, i (q.position)}
                {#if q.error}
                  <li>
                    <button onclick={() => { currentIndex = i; }} class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-danger-soft">
                      <AlertCircle size={14} class="shrink-0 text-danger" />
                      <span class="font-semibold">Câu {i + 1}:</span>
                      <span class="truncate text-muted">{ERROR_TEXT[q.error]}</span>
                    </button>
                  </li>
                {/if}
              {/each}
            </ul>
          </div>
        {/if}

        <div class="card p-3">
          <div class="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
            {#each questions as q, i (q.position)}
              <button onclick={() => { currentIndex = i; }}
                class="h-8 min-w-8 rounded-lg px-1.5 text-xs font-bold tabular-nums transition
                  {currentIndex === i ? 'bg-accent text-on-accent' : q.error ? 'bg-danger-soft text-danger' : 'bg-sunken text-muted hover:text-ink'}"
                aria-label="Câu {i + 1}{q.error ? ', có lỗi' : ''}">{i + 1}</button>
            {/each}
          </div>
        </div>

        {@const currentQ = questions[currentIndex]}
        {#if currentQ}
          <article class="card p-6">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-sm font-bold text-accent">Câu {currentIndex + 1}</span>
              <span class="text-sm text-faint">/ {questions.length}</span>
              {#if currentQ.multi}<span class="tag bg-warning-soft text-warning">Nhiều đáp án</span>{/if}
              {#if currentQ.error}<span class="tag bg-danger-soft text-danger"><AlertCircle size={12} /> {ERROR_TEXT[currentQ.error]}</span>{/if}
            </div>
            <h3 class="mt-3 whitespace-pre-line text-[17px] font-semibold leading-relaxed">{currentQ.content || 'Chưa có nội dung câu hỏi'}</h3>
            <div class="mt-5 grid gap-2 sm:grid-cols-2">
              {#each currentQ.options as opt, oi (oi)}
                <div class="flex items-start gap-3 rounded-xl border-2 p-3 {opt.is_correct ? 'border-success bg-success-soft' : 'border-line'}">
                  <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold {opt.is_correct ? 'border-success bg-success text-surface' : 'border-line-strong text-muted'}">
                    {opt.label || String.fromCharCode(65 + oi)}
                  </span>
                  <span class="whitespace-pre-line pt-0.5 text-sm font-medium">{opt.text}</span>
                </div>
              {/each}
            </div>
            {#if currentQ.explanation}
              <p class="mt-4 whitespace-pre-line rounded-xl bg-sunken px-4 py-3 text-sm"><span class="font-semibold">Giải thích:</span> {currentQ.explanation}</p>
            {/if}
            <div class="mt-6 flex justify-between border-t border-line pt-4">
              <button disabled={currentIndex === 0} onclick={() => { currentIndex--; }} class="btn btn-ghost btn-sm"><ChevronLeft size={16} /> Câu trước</button>
              <button disabled={currentIndex === questions.length - 1} onclick={() => { currentIndex++; }} class="btn btn-ghost btn-sm">Câu sau <ChevronRight size={16} /></button>
            </div>
          </article>
        {/if}
      {/if}
    </section>
  </div>
</div>
