<!-- src/routes/ai-quiz/+page.svelte -->
<script lang="ts">
  import { GraduationCap, Globe, Lock, Upload, X, FileText, Sparkles, Plus, Trash2 } from 'lucide-svelte';
  import { authStore } from '$lib/stores/auth.svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase/client';

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
  let fileInput: HTMLInputElement;

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

  function fileIcon(name: string) {
    if (name.endsWith('.pdf')) return '📄';
    return '📝';
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
    if (!canSubmit || !authStore.user) return;

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
      const parseRes = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const parsed = await parseRes.json();

      progress = 'Đang lưu đề thi…';
      const sectionsJson = sections.length > 0 ? sections : null;

      const { data: quiz, error: qErr } = await supabase
        .from('quizzes')
        .insert({
          owner_id: authStore.user.id,
          title:    quizName.trim(),
          subject:  subject || level,
          raw_text: text,
          is_public: isPublic,
          sections: sectionsJson
        })
        .select('id').single();
      if (qErr || !quiz) throw qErr ?? new Error('Lỗi tạo quiz');

      const validQs = parsed.questions
        .filter((q: { error?: string }) => !q.error)
        .map((q: { position: number; content: string; options: unknown[]; multi: boolean }) => ({
          quiz_id: quiz.id, position: q.position,
          content: q.content, options: q.options, multi: q.multi
        }));
      if (validQs.length > 0) await supabase.from('questions').insert(validQs);

      goto(`/quiz/${quiz.id}`);
    } catch (e: unknown) {
      error   = e instanceof Error ? e.message : 'Lỗi không xác định';
      loading = false; progress = '';
    }
  }
</script>

<svelte:head><title>AI Tạo đề — HeduQuiz</title></svelte:head>

<div class="mx-auto max-w-lg py-6" style="color:#1e293b;">

  <!-- Header -->
  <div class="mb-6 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 p-7 text-white shadow-xl">
    <div class="flex items-center gap-3">
      <div class="rounded-2xl bg-white/20 p-3"><Sparkles size={24} /></div>
      <div>
        <h1 class="text-xl font-black uppercase tracking-tight">AI Tạo đề</h1>
        <p class="text-sm" style="color:#fce7f3;">Gemini sinh bộ đề từ chủ đề hoặc file tài liệu</p>
      </div>
    </div>
  </div>

  <div class="rounded-[2rem] p-7 shadow-sm space-y-5" style="background:#ffffff;border:1px solid #f1f5f9;">

    <!-- Mode toggle -->
    <div class="flex rounded-xl p-1" style="background:#f1f5f9;border:1px solid #e2e8f0;">
      <button onclick={() => { mode = 'topic'; }}
        class="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[11px] font-black uppercase transition"
        style="background:{mode === 'topic' ? '#ffffff' : 'transparent'};color:{mode === 'topic' ? '#4338ca' : '#94a3b8'};box-shadow:{mode === 'topic' ? '0 1px 3px #0001' : 'none'};">
        <Sparkles size={13} /> Từ chủ đề
      </button>
      <button onclick={() => { mode = 'file'; }}
        class="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[11px] font-black uppercase transition"
        style="background:{mode === 'file' ? '#ffffff' : 'transparent'};color:{mode === 'file' ? '#db2777' : '#94a3b8'};box-shadow:{mode === 'file' ? '0 1px 3px #0001' : 'none'};">
        <Upload size={13} /> Từ file
      </button>
    </div>

    <!-- Tên đề (luôn hiện) -->
    <div class="space-y-1.5">
      <label class="text-[10px] font-black uppercase tracking-widest" style="color:#94a3b8;" for="quizName">
        Tên đề thi <span style="color:#f43f5e;">*</span>
      </label>
      <input id="quizName" type="text" bind:value={quizName}
        placeholder="VD: Đề thi Hóa học kỳ 1, Ôn tập Lịch sử…"
        class="w-full rounded-xl px-4 py-3 font-medium outline-none transition"
        style="background:#f8fafc;color:#1e293b;border:1px solid #e2e8f0;" />
    </div>

    <!-- Chủ đề (chỉ mode=topic) -->
    {#if mode === 'topic'}
      <div class="space-y-1.5">
        <label class="text-[10px] font-black uppercase tracking-widest" style="color:#94a3b8;" for="topic">
          Chủ đề / Nội dung <span style="color:#f43f5e;">*</span>
        </label>
        <input id="topic" type="text" bind:value={topic}
          placeholder="VD: Hóa học hữu cơ, Cách mạng tháng 8…"
          class="w-full rounded-xl px-4 py-3 font-medium outline-none transition"
          style="background:#f8fafc;color:#1e293b;border:1px solid #e2e8f0;" />
      </div>
    {/if}

    <!-- Upload file (chỉ mode=file) -->
    {#if mode === 'file'}
      <div class="space-y-1.5">
        <label class="text-[10px] font-black uppercase tracking-widest" style="color:#94a3b8;">
          File tài liệu <span style="color:#f43f5e;">*</span>
          <span class="font-medium normal-case" style="color:#94a3b8;"> (PDF, DOC, DOCX — tối đa 10MB)</span>
        </label>

        {#if uploadedFile}
          <div class="flex items-center gap-3 rounded-2xl px-4 py-3" style="background:#eef2ff;border:2px solid #c7d2fe;">
            <span class="text-2xl">{fileIcon(uploadedFile.name)}</span>
            <div class="min-w-0 flex-1">
              <p class="truncate font-bold text-sm" style="color:#1e293b;">{uploadedFile.name}</p>
              <p class="text-[10px]" style="color:#94a3b8;">{formatSize(uploadedFile.size)}</p>
            </div>
            <button onclick={() => { uploadedFile = null; }} style="color:#cbd5e1;" class="transition hover:text-red-400">
              <X size={16} />
            </button>
          </div>
        {:else}
          <div
            class="flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-8 text-center transition cursor-pointer"
            style="border:2px dashed {dragOver ? '#818cf8' : '#e2e8f0'};background:{dragOver ? '#eef2ff' : '#f8fafc'};"
            ondragover={(e) => { e.preventDefault(); dragOver = true; }}
            ondragleave={() => { dragOver = false; }}
            ondrop={onDrop}
            onclick={() => fileInput.click()}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); }}
            tabindex="0" role="button" aria-label="Chọn file"
          >
            <div class="rounded-2xl p-3 shadow-sm" style="background:#ffffff;">
              <FileText size={24} style="color:#818cf8;" />
            </div>
            <div>
              <p class="font-bold text-sm" style="color:#475569;">Kéo thả file vào đây</p>
              <p class="text-[11px] mt-0.5" style="color:#94a3b8;">hoặc click để chọn</p>
            </div>
          </div>
          <input bind:this={fileInput} type="file" accept={ACCEPT} class="hidden"
            onchange={(e) => handleFileSelect((e.target as HTMLInputElement).files)} />
        {/if}
      </div>
    {/if}

    <!-- Môn học -->
    <div class="space-y-1.5">
      <label class="text-[10px] font-black uppercase tracking-widest" style="color:#94a3b8;" for="subject">
        Môn học <span class="font-medium normal-case" style="color:#cbd5e1;">(tùy chọn)</span>
      </label>
      <input id="subject" type="text" bind:value={subject}
        placeholder="VD: Hóa học, Lịch sử, Toán…"
        class="w-full rounded-xl px-4 py-3 font-medium outline-none transition"
        style="background:#f8fafc;color:#1e293b;border:1px solid #e2e8f0;" />
    </div>

    <!-- Trình độ + Số câu -->
    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-1.5">
        <label class="text-[10px] font-black uppercase tracking-widest" style="color:#94a3b8;" for="level">Trình độ</label>
        <div class="relative">
          <select id="level" bind:value={level}
            class="w-full appearance-none rounded-xl px-4 py-3 font-bold outline-none transition"
            style="background:#f8fafc;color:#1e293b;border:1px solid #e2e8f0;">
            {#each levels as l (l)}<option value={l}>{l}</option>{/each}
          </select>
          <GraduationCap size={15} class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style="color:#94a3b8;" />
        </div>
      </div>
      <div class="space-y-1.5">
        <label class="text-[10px] font-black uppercase tracking-widest" style="color:#94a3b8;" for="cnt">Số câu hỏi</label>
        <input id="cnt" type="number" min="3" max="100" bind:value={count}
          class="w-full rounded-xl px-4 py-3 font-bold outline-none transition"
          style="background:#f8fafc;color:#1e293b;border:1px solid #e2e8f0;" />
      </div>
    </div>

    <!-- Ghi chú cho AI -->
    <div class="space-y-1.5">
      <label class="text-[10px] font-black uppercase tracking-widest" style="color:#94a3b8;" for="prompt">
        Ghi chú / Hướng dẫn thêm cho AI
        <span class="font-medium normal-case" style="color:#cbd5e1;">(tùy chọn)</span>
      </label>
      <textarea id="prompt" bind:value={prompt} rows="2"
        placeholder={mode === 'file'
          ? 'VD: File chỉ có câu hỏi, tự suy luận đáp án. Tập trung chương 3…'
          : 'VD: Không ra câu địa lý, tập trung giai đoạn 1945–1975…'}
        class="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none resize-none transition"
        style="background:#f8fafc;color:#1e293b;border:1px solid #e2e8f0;"
      ></textarea>
    </div>

    <!-- Phân chia phần thi -->
    <div class="rounded-2xl overflow-hidden" style="border:1px solid #e2e8f0;">
      <button
        onclick={() => { showSections = !showSections; }}
        class="flex w-full items-center justify-between px-4 py-3 text-left transition"
        style="background:{showSections ? '#f8fafc' : '#ffffff'};color:#475569;"
      >
        <span class="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider">
          <span>📋</span> Phân chia phần thi
          {#if sections.length > 0}
            <span class="rounded-full px-2 py-0.5 text-[10px] font-black" style="background:#eef2ff;color:#4338ca;">
              {sections.length} phần
            </span>
          {/if}
        </span>
        <span class="text-[10px] transition-transform" style="transform:{showSections ? 'rotate(90deg)' : 'rotate(0deg)'};display:inline-block;">▶</span>
      </button>

      {#if showSections}
        <div class="px-4 pb-4 pt-2 space-y-2" style="border-top:1px solid #f1f5f9;">
          <p class="text-[11px]" style="color:#94a3b8;">
            Chia {count} câu thành nhiều phần. Người dùng có thể chọn phần khi ôn thi.
          </p>
          {#each sections as sec, i (sec.id)}
            <div class="flex items-center gap-2 rounded-xl px-3 py-2" style="background:#f8fafc;border:1px solid #e2e8f0;">
              <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black" style="background:#eef2ff;color:#4338ca;">{i+1}</span>
              <input bind:value={sec.name} placeholder="Tên phần…"
                class="flex-1 min-w-0 bg-transparent text-sm font-bold outline-none" style="color:#1e293b;" />
              <span class="text-[11px] shrink-0" style="color:#94a3b8;">Câu</span>
              <input type="number" min="1" max={count} bind:value={sec.from}
                class="w-12 rounded-lg px-2 py-1 text-center text-sm font-bold outline-none" style="background:#ffffff;border:1px solid #e2e8f0;color:#1e293b;" />
              <span class="text-[11px]" style="color:#94a3b8;">→</span>
              <input type="number" min="1" max={count} bind:value={sec.to}
                class="w-12 rounded-lg px-2 py-1 text-center text-sm font-bold outline-none" style="background:#ffffff;border:1px solid #e2e8f0;color:#1e293b;" />
              <button onclick={() => removeSection(sec.id)} class="transition" style="color:#cbd5e1;" onmouseenter={(e) => (e.currentTarget as HTMLElement).style.color='#f87171'} onmouseleave={(e) => (e.currentTarget as HTMLElement).style.color='#cbd5e1'}>
                <Trash2 size={14} />
              </button>
            </div>
          {/each}
          <button onclick={addSection}
            class="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[11px] font-black uppercase transition"
            style="border:2px dashed #e2e8f0;color:#94a3b8;background:transparent;">
            <Plus size={13} /> Thêm phần
          </button>
        </div>
      {/if}
    </div>

    <!-- Public toggle -->
    <div class="flex rounded-xl p-1" style="background:#f1f5f9;border:1px solid #e2e8f0;">
      <button onclick={() => { isPublic = false; }}
        class="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[10px] font-black uppercase transition"
        style="background:{!isPublic ? '#ffffff' : 'transparent'};color:{!isPublic ? '#4338ca' : '#94a3b8'};box-shadow:{!isPublic ? '0 1px 3px #0001' : 'none'};">
        <Lock size={12} /> Riêng tư
      </button>
      <button onclick={() => { isPublic = true; }}
        class="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[10px] font-black uppercase transition"
        style="background:{isPublic ? '#ffffff' : 'transparent'};color:{isPublic ? '#059669' : '#94a3b8'};box-shadow:{isPublic ? '0 1px 3px #0001' : 'none'};">
        <Globe size={12} /> Công khai
      </button>
    </div>

    {#if error}
      <p class="rounded-xl px-4 py-3 text-sm font-medium" style="background:#fef2f2;color:#dc2626;">{error}</p>
    {/if}

    <!-- Submit -->
    <button onclick={handleGenerate} disabled={!canSubmit}
      class="flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-sm font-black uppercase tracking-widest shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed"
      style="background:{canSubmit ? 'linear-gradient(to right,#ec4899,#6366f1)' : '#e2e8f0'};color:{canSubmit ? '#ffffff' : '#94a3b8'};">
      {#if loading}
        <svg class="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        {progress}
      {:else}
        <Sparkles size={18} />
        {mode === 'file' ? 'Tạo đề từ file' : 'Tạo đề ngay'}
      {/if}
    </button>
  </div>
</div>

<style>
  select { -webkit-appearance: none; -moz-appearance: none; appearance: none; }
</style>
