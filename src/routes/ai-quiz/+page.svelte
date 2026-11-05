<!-- src/routes/ai-quiz/+page.svelte -->
<script lang="ts">
  import { Globe, Lock, Upload, X, FileText, Sparkles, Plus, Trash2, ChevronDown, AlertCircle, ArrowLeft } from 'lucide-svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { parseQuizText } from '$lib/utils/quizParser';
  import { saveQuiz } from '$lib/supabase/saveQuiz';

  type Level = typeof levels[number];
  type Mode  = 'topic' | 'file';

  const levels = ['Tiểu học', 'THCS', 'THPT', 'Cao đẳng', 'Đại học'] as const;

  const levelToPrompt: Record<Level, string> = {
    'Tiểu học': 'very simple (elementary school level)',
    'THCS':     'simple (middle school level)',
    'THPT':     'medium (high school level)',
    'Cao đẳng': 'medium-hard (college level)',
    'Đại học':  'advanced (university level)'
  };

  // ── Form state ────────────────────────────────────────────
  let mode     = $state<Mode>('topic');
  let quizName = $state('');        // tên đề (tự đặt)
  let topic    = $state('');        // chủ đề (mode=topic)
  let subject  = $state('');        // môn học
  let level    = $state<Level>('Đại học');
  let count    = $state(10);
  let isPublic = $state(false);
  let prompt   = $state('');        // ghi chú cho AI
  let loading  = $state(false);
  let error    = $state('');
  let progress = $state('');

  // ── File state ────────────────────────────────────────────
  let uploadedFile    = $state<File | null>(null);
  let dragOver        = $state(false);
  let fileInput = $state<HTMLInputElement>();

  // ── Sections state ────────────────────────────────────────
  interface Section { id: string; name: string; from: number; to: number }
  let sections     = $state<Section[]>([]);
  let showSections = $state(false);

  function addSection() {
    const prev = sections[sections.length - 1];
    const from = prev ? prev.to + 1 : 1;
    const to   = from + count - 1;
    sections = [...sections, {
      id: crypto.randomUUID(),
      name: `Phần ${sections.length + 1}`,
      from,
      to
    }];
  }

  function removeSection(id: string) {
    sections = sections.filter(s => s.id !== id);
  }

  function validateSections(): string | null {
    for (const s of sections) {
      if (!s.name.trim()) return 'Tên phần không được để trống';
      if (s.from < 1 || s.to < s.from) return `Phần "${s.name}": phạm vi không hợp lệ`;
      if (s.to > count) return `Phần "${s.name}": câu ${s.to} vượt tổng (${count} câu)`;
    }
    for (let i = 0; i < sections.length; i++) {
      for (let j = i + 1; j < sections.length; j++) {
        const a = sections[i], b = sections[j];
        if (!(a.to < b.from || b.to < a.from))
          return `"${a.name}" và "${b.name}" bị trùng phạm vi`;
      }
    }
    return null;
  }

  // ── File helpers ──────────────────────────────────────────
  const ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  function handleFileSelect(files: FileList | null) {
    if (!files?.length) return;
    const f = files[0];
    if (f.size > 10 * 1024 * 1024) { error = 'File tối đa 10MB'; return; }
    uploadedFile = f;
    // Tự điền tên đề từ tên file nếu chưa nhập
    if (!quizName) quizName = f.name.replace(/\.[^.]+$/, '');
    error = '';
  }

  function onDrop(e: DragEvent) {
    e.preventDefault(); dragOver = false;
    handleFileSelect(e.dataTransfer?.files ?? null);
  }

  function formatSize(b: number) {
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function toBase64(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res((r.result as string).split(',')[1]);
      r.onerror = () => rej(new Error('Không đọc được file'));
      r.readAsDataURL(file);
    });
  }

  const canSubmit = $derived(
    !loading && quizName.trim().length > 0 && (
      mode === 'topic' ? topic.trim().length > 0 : uploadedFile !== null
    )
  );

  // ── Submit ────────────────────────────────────────────────
  async function handleGenerate() {
    if (!canSubmit || !page.data.profile) return;

    const secErr = validateSections();
    if (secErr) { error = secErr; return; }

    loading = true; error = ''; progress = 'Đang chuẩn bị…';

    try {
      let text = '';

      if (mode === 'file' && uploadedFile) {
        progress = 'Đang đọc file…';
        const base64   = await toBase64(uploadedFile);
        const mimeType = uploadedFile.type || 'application/pdf';

        progress = 'AI đang phân tích tài liệu…';
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'file', fileBase64: base64, mimeType,
            questionCount: count, difficulty: levelToPrompt[level],
            level, subject: subject || quizName,
            customPrompt: prompt.trim() || null
          })
        });
        if (!res.ok) throw new Error(await res.text());
        ({ text } = await res.json());

      } else {
        progress = 'AI đang tạo câu hỏi…';
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'generate', topic, subject: subject || topic,
            questionCount: count, difficulty: levelToPrompt[level],
            level, customPrompt: prompt.trim() || null
          })
        });
        if (!res.ok) throw new Error(await res.text());
        ({ text } = await res.json());
      }

      progress = 'Đang xử lý câu hỏi…';
      const parsed = parseQuizText(text);
      if (parsed.stats.valid === 0) throw new Error('AI không trả về câu hỏi hợp lệ nào, hãy thử lại.');

      progress = 'Đang lưu đề thi…';
      const id = await saveQuiz({
        title: quizName,
        subject: subject || level,
        rawText: text,
        isPublic,
        sections,
        questions: parsed.questions
      });

      goto(`/quiz/${id}`);
    } catch (e: unknown) {
      error   = e instanceof Error ? e.message : 'Lỗi không xác định';
      loading = false; progress = '';
    }
  }
</script>

<svelte:head><title>Tạo đề bằng AI · HeduQuiz</title></svelte:head>

<div class="mx-auto max-w-2xl space-y-5">
  <div class="flex items-center gap-3">
    <a href="/kho-de" class="btn btn-ghost btn-icon" aria-label="Quay lại"><ArrowLeft size={18} /></a>
    <div>
      <h1 class="flex items-center gap-2 text-2xl font-extrabold tracking-tight"><Sparkles size={22} class="text-accent" /> Tạo đề bằng AI</h1>
      <p class="text-sm text-muted">Gemini tạo bộ câu hỏi từ một chủ đề hoặc từ tài liệu của bạn.</p>
    </div>
  </div>

  <section class="card space-y-6 p-6">
    <div class="segmented" role="group" aria-label="Nguồn tạo đề">
      <button aria-pressed={mode === 'topic'} onclick={() => { mode = 'topic'; }}>Từ chủ đề</button>
      <button aria-pressed={mode === 'file'} onclick={() => { mode = 'file'; }}>Từ tài liệu</button>
    </div>

    <div>
      <label class="label" for="quizName">Tên đề</label>
      <input id="quizName" bind:value={quizName} placeholder="Ví dụ: Lịch sử 12, giai đoạn 1945-1954" class="input" />
    </div>

    {#if mode === 'topic'}
      <div>
        <label class="label" for="topic">Chủ đề</label>
        <input id="topic" bind:value={topic} placeholder="Ví dụ: Cách mạng tháng Tám năm 1945" class="input" />
      </div>
    {:else}
      <div>
        <span class="label">Tài liệu</span>
        {#if uploadedFile}
          <div class="flex items-center gap-3 rounded-xl border border-line bg-sunken px-4 py-3">
            <FileText size={20} class="shrink-0 text-accent" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold">{uploadedFile.name}</p>
              <p class="text-xs text-muted">{formatSize(uploadedFile.size)}</p>
            </div>
            <button onclick={() => { uploadedFile = null; }} class="btn btn-ghost btn-icon" aria-label="Bỏ file"><X size={16} /></button>
          </div>
        {:else}
          <button
            class="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition {dragOver ? 'border-accent bg-accent-soft' : 'border-line-strong hover:border-accent'}"
            ondragover={(e) => { e.preventDefault(); dragOver = true; }}
            ondragleave={() => { dragOver = false; }}
            ondrop={onDrop}
            onclick={() => fileInput?.click()}
          >
            <Upload size={22} class="text-muted" />
            <span class="text-sm font-semibold">Kéo thả hoặc bấm để chọn file</span>
            <span class="text-xs text-muted">PDF, DOC, DOCX, tối đa 10MB</span>
          </button>
          <input bind:this={fileInput} type="file" accept={ACCEPT} class="hidden"
            onchange={(e) => handleFileSelect((e.target as HTMLInputElement).files)} />
        {/if}
      </div>
    {/if}

    <div class="grid gap-4 sm:grid-cols-3">
      <div>
        <label class="label" for="subject">Môn học</label>
        <input id="subject" bind:value={subject} placeholder="Không bắt buộc" class="input" />
      </div>
      <div>
        <label class="label" for="level">Trình độ</label>
        <select id="level" bind:value={level} class="input">
          {#each levels as l (l)}<option value={l}>{l}</option>{/each}
        </select>
      </div>
      <div>
        <label class="label" for="cnt">Số câu</label>
        <input id="cnt" type="number" min="3" max="100" bind:value={count} class="input" />
      </div>
    </div>

    <div>
      <label class="label" for="prompt">Ghi chú cho AI</label>
      <textarea id="prompt" bind:value={prompt} rows="3" maxlength="500" class="input resize-y"
        placeholder="Ví dụ: tập trung vào mốc thời gian, mỗi câu 4 đáp án"></textarea>
    </div>

    <div>
      <span class="label">Hiển thị</span>
      <div class="segmented" role="group" aria-label="Chế độ hiển thị">
        <button aria-pressed={!isPublic} onclick={() => { isPublic = false; }}><Lock size={14} /> Riêng tư</button>
        <button aria-pressed={isPublic} onclick={() => { isPublic = true; }}><Globe size={14} /> Công khai</button>
      </div>
    </div>
  </section>

  <section class="card overflow-hidden">
    <button onclick={() => { showSections = !showSections; }} aria-expanded={showSections}
      class="flex w-full items-center gap-2 px-5 py-4 text-left font-semibold hover:bg-sunken">
      Chia phần thi
      {#if sections.length > 0}<span class="tag bg-accent-soft text-accent-ink">{sections.length} phần</span>{/if}
      <ChevronDown size={18} class="ml-auto text-muted transition {showSections ? 'rotate-180' : ''}" />
    </button>
    {#if showSections}
      <div class="space-y-2 border-t border-line p-5">
        <p class="text-sm text-muted">Chia {count} câu thành nhiều phần, khi ôn có thể chọn từng phần.</p>
        {#each sections as sec, i (sec.id)}
          <div class="flex flex-wrap items-center gap-3 rounded-xl bg-sunken px-4 py-3">
            <label class="min-w-[8rem] flex-1">
              <span class="sr-only">Tên phần {i + 1}</span>
              <input bind:value={sec.name} class="w-full bg-transparent text-sm font-semibold outline-none" />
            </label>
            <span class="flex items-center gap-1.5 text-sm text-muted">
              Câu
              <input type="number" min="1" max={count} bind:value={sec.from} aria-label="Từ câu" class="input w-16 px-2 py-1.5 text-center" />
              đến
              <input type="number" min="1" max={count} bind:value={sec.to} aria-label="Đến câu" class="input w-16 px-2 py-1.5 text-center" />
            </span>
            <button onclick={() => removeSection(sec.id)} class="btn btn-ghost btn-icon hover:text-danger" aria-label="Xoá phần {i + 1}"><Trash2 size={15} /></button>
          </div>
        {/each}
        <button onclick={addSection} class="btn btn-secondary w-full border-dashed"><Plus size={15} /> Thêm phần</button>
      </div>
    {/if}
  </section>

  {#if error}
    <p class="flex items-start gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger" role="alert"><AlertCircle size={16} class="mt-0.5 shrink-0" /> {error}</p>
  {/if}

  <button onclick={handleGenerate} disabled={!canSubmit} class="btn btn-primary btn-lg w-full">
    <Sparkles size={18} /> {loading ? progress || 'Đang tạo…' : 'Tạo đề'}
  </button>
</div>
