<!-- src/routes/tao-de/+page.svelte -->
<script lang="ts">
  import { parseQuizText } from '$lib/utils/quizParser';
  import { Eye, Globe, Lock, Info, ChevronLeft, ChevronRight, GraduationCap, Save, Plus, Trash2, LayoutList } from 'lucide-svelte';
  import { supabase } from '$lib/supabase/client';
  import { authStore } from '$lib/stores/auth.svelte';
  import { goto } from '$app/navigation';
  // import { page } from '$app/state';

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

  $effect(() => {
    quizTitle      = editQuiz?.title      ?? '';
    educationLevel = editQuiz?.subject    ?? 'Đại học';
    isPublic       = editQuiz?.is_public  ?? false;
    quizRawText    = editQuiz?.raw_text   ?? '';
    sections       = (editQuiz as { sections: Section[] })?.sections ?? [];
    currentIndex   = 0;
  });

  const levels = ['Tiểu học', 'THCS', 'THPT', 'Cao đẳng', 'Đại học'];

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
    if (!canSave || !authStore.user) return;

    const sectionErr = validateSections();
    if (sectionErr) { saveError = sectionErr; return; }

    saving = true; saveError = '';

    try {
      const validQs = questions
        .filter(q => !q.error)
        .map(q => ({ position: q.position, content: q.content, options: q.options, multi: q.multi }));

      const sectionsJson = sections.length > 0 ? sections : null;

      if (isEdit && editQuiz) {
        const { error: uErr } = await supabase
          .from('quizzes')
          .update({
            title: quizTitle.trim(),
            subject: educationLevel,
            raw_text: quizRawText,
            is_public: isPublic,
            sections: sectionsJson
          })
          .eq('id', editQuiz.id);
        if (uErr) throw uErr;

        await supabase.from('questions').delete().eq('quiz_id', editQuiz.id);
        if (validQs.length > 0) {
          const { error: qErr } = await supabase.from('questions')
            .insert(validQs.map(q => ({ ...q, quiz_id: editQuiz.id })));
          if (qErr) throw qErr;
        }
        goto(`/quiz/${editQuiz.id}`);
      } else {
        const { data: quiz, error: qErr } = await supabase
          .from('quizzes')
          .insert({
            owner_id: authStore.user.id,
            title: quizTitle.trim(),
            subject: educationLevel,
            raw_text: quizRawText,
            is_public: isPublic,
            sections: sectionsJson
          })
          .select('id').single();
        if (qErr || !quiz) throw qErr ?? new Error('Lỗi tạo quiz');

        if (validQs.length > 0) {
          const { error: qsErr } = await supabase.from('questions')
            .insert(validQs.map(q => ({ ...q, quiz_id: quiz.id })));
          if (qsErr) throw qsErr;
        }
        goto(`/quiz/${quiz.id}`);
      }
    } catch (e: unknown) {
      saveError = e instanceof Error ? e.message : 'Lỗi không xác định';
      saving = false;
    }
  }
</script>

<svelte:head><title>{isEdit ? 'Sửa đề' : 'Tạo đề'} — HeduQuiz</title></svelte:head>

<div class="mx-auto max-w-[1400px] space-y-5">

  <div class="grid grid-cols-1 items-end gap-4 rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm sm:grid-cols-3">
    <div class="space-y-1.5">
      <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400" for="quizTitle">
        {isEdit ? 'Sửa tên đề' : 'Tên bộ đề'}
      </label>
      <input id="quizTitle" bind:value={quizTitle} placeholder="Nhập tên đề..."
        class="w-full rounded-xl bg-slate-50 px-4 py-3 font-bold text-slate-800 outline-none transition focus:ring-2 focus:ring-indigo-400/30 focus:bg-white" />
    </div>

    <div class="space-y-1.5">
      <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400" for="level">Trình độ</label>
      <div class="relative">
        <select id="level" bind:value={educationLevel}
          class="w-full appearance-none rounded-xl bg-slate-50 px-4 py-3 font-bold text-slate-800 outline-none transition focus:ring-2 focus:ring-indigo-400/30 focus:bg-white">
          {#each levels as l (l)}<option value={l}>{l}</option>{/each}
        </select>
        <GraduationCap size={16} class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>
    </div>

    <div class="flex items-center gap-2">
      <div class="flex flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-1">
        <button onclick={() => { isPublic = false; }}
          class="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[10px] font-black uppercase transition
            {!isPublic ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}">
          <Lock size={12} /> Riêng tư
        </button>
        <button onclick={() => { isPublic = true; }}
          class="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[10px] font-black uppercase transition
            {isPublic ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}">
          <Globe size={12} /> Công khai
        </button>
      </div>

      <button disabled={!canSave} onclick={handleSave}
        class="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-[10px] font-black uppercase tracking-wider text-white shadow-md disabled:bg-slate-200 disabled:cursor-not-allowed transition-all hover:bg-indigo-700">
        <Save size={14} />
        {saving ? 'Đang lưu…' : isEdit ? 'Cập nhật' : `Lưu (${stats.valid} câu)`}
      </button>
    </div>
  </div>

  {#if saveError}
    <p class="rounded-2xl bg-red-50 px-5 py-3 text-sm font-medium text-red-600">{saveError}</p>
  {/if}

  <!-- Sections panel -->
  {#if stats.valid > 0}
    <div class="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
      <button
        onclick={() => { showSections = !showSections; }}
        class="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-slate-50"
      >
        <div class="flex items-center gap-2.5">
          <LayoutList size={16} class="text-indigo-500" />
          <span class="text-xs font-black uppercase tracking-widest text-slate-600">Phân chia phần thi</span>
          {#if sections.length > 0}
            <span class="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-black text-indigo-600">
              {sections.length} phần
            </span>
          {/if}
        </div>
        <ChevronRight size={16} class="text-slate-400 transition-transform {showSections ? 'rotate-90' : ''}" />
      </button>

      {#if showSections}
        <div class="border-t border-slate-100 px-6 pb-5 pt-4 space-y-3">
          <p class="text-[11px] text-slate-400">
            Chia bộ đề <strong class="text-slate-600">{stats.valid} câu</strong> thành nhiều phần. Khi ôn thi, người dùng có thể chọn phần cụ thể.
          </p>

          {#each sections as sec, i (sec.id)}
            <div class="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-black text-indigo-600">
                {i + 1}
              </span>
              <input
                bind:value={sec.name}
                placeholder="Tên phần..."
                class="flex-1 min-w-0 bg-transparent font-bold text-sm text-slate-800 outline-none"
              />
              <div class="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
                <span>Câu</span>
                <input
                  type="number" min="1" max={stats.valid}
                  bind:value={sec.from}
                  class="w-14 rounded-lg bg-white border border-slate-200 px-2 py-1 text-center font-bold text-slate-700 outline-none focus:border-indigo-400"
                />
                <span>→</span>
                <input
                  type="number" min="1" max={stats.valid}
                  bind:value={sec.to}
                  class="w-14 rounded-lg bg-white border border-slate-200 px-2 py-1 text-center font-bold text-slate-700 outline-none focus:border-indigo-400"
                />
              </div>
              <button onclick={() => removeSection(sec.id)} class="text-slate-300 transition hover:text-red-400">
                <Trash2 size={14} />
              </button>
            </div>
          {/each}

          <button
            onclick={addSection}
            class="flex items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-400 transition hover:border-indigo-300 hover:text-indigo-500 w-full justify-center"
          >
            <Plus size={13} /> Thêm phần
          </button>
        </div>
      {/if}
    </div>
  {/if}

  <!-- 2-col editor -->
  <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">

    <!-- LEFT -->
    <div class="space-y-4 lg:col-span-5">
      <div class="overflow-hidden rounded-[1.5rem] bg-indigo-600 p-4 text-white shadow-lg shadow-indigo-100">
        <p class="flex items-center gap-2 text-[10px] font-black uppercase mb-1.5"><Info size={12}/> Cú pháp</p>
        <div class="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] font-medium opacity-90">
          <span><code class="rounded bg-white/20 px-1">*A.</code> đáp án đúng</span>
          <span><code class="rounded bg-white/20 px-1">**A.</code> nhiều đáp án</span>
          <span>Dòng trắng → câu mới</span>
          <span><code class="rounded bg-white/20 px-1">&lt;br /&gt;</code> xuống dòng</span>
        </div>
      </div>

      <div class="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl">
        <textarea bind:value={quizRawText} spellcheck="false"
          placeholder="Câu hỏi đầu tiên?\n*A. Đáp án đúng\nB. Đáp án sai\nC. Đáp án sai\nD. Đáp án sai\n\nCâu hỏi tiếp theo?..."
          class="h-[520px] w-full resize-none bg-slate-50/50 p-6 font-mono text-sm text-slate-700 outline-none">
        </textarea>
      </div>
    </div>

    <!-- RIGHT: Preview -->
    <div class="space-y-4 lg:col-span-7">
      <div class="flex items-center gap-3 px-1">
        <h2 class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
          <Eye size={14} class="text-indigo-500" /> Preview
        </h2>
        {#if stats.total > 0}
          <span class="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-black text-indigo-600">
            {stats.valid}/{stats.total} hợp lệ
          </span>
          {#if stats.errorCount > 0}
            <span class="rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-black text-red-500">
              {stats.errorCount} lỗi
            </span>
          {/if}
        {/if}
      </div>

      {#if questions.length === 0}
        <div class="flex h-[400px] items-center justify-center rounded-[2.5rem] border-4 border-dashed border-slate-100 text-slate-300">
          <p class="text-[10px] font-bold uppercase tracking-widest">Nhập nội dung bên trái để preview</p>
        </div>
      {:else}
        <!-- Navigator -->
        <div class="rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm">
          <div class="flex max-h-28 flex-wrap gap-2 overflow-y-auto">
            {#each questions as q, i (q.position)}
              <button onclick={() => { currentIndex = i; }}
                class="h-8 w-8 rounded-lg border-2 text-xs font-bold transition-all
                  {currentIndex === i ? 'scale-105 border-indigo-600 bg-indigo-600 text-white shadow' :
                   q.error ? 'border-red-300 bg-red-50 text-red-400' :
                   'border-slate-100 text-slate-400 hover:border-indigo-200'}">
                {i + 1}
              </button>
            {/each}
          </div>
        </div>

        <!-- Question card -->
        {@const currentQ = questions[currentIndex]}
        {#if currentQ}
          <div class="relative flex min-h-[380px] flex-col rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-xl">
            <div class="flex-1">
              <div class="mb-3 flex flex-wrap items-center gap-2">
                <span class="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                  {currentIndex + 1} / {questions.length}
                </span>
                {#if currentQ.multi}
                  <span class="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase text-amber-700">Nhiều đáp án</span>
                {/if}
                {#if currentQ.error}
                  <span class="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-black text-red-600">⚠ Lỗi</span>
                {/if}
              </div>

              <h3 class="text-lg font-bold leading-snug text-slate-800">{currentQ.content}</h3>

              <div class="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {#each currentQ.options as opt, oi (oi)}
                  <div class="flex items-start gap-3 rounded-2xl border-2 p-3.5 transition
                    {opt.is_correct ? 'border-emerald-400/50 bg-emerald-50' : 'border-slate-100 bg-slate-50'}">
                    <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-black transition
                      {opt.is_correct ? 'border-transparent bg-emerald-500 text-white' : 'border-slate-200 bg-white text-slate-400'}">
                      {opt.label || String.fromCharCode(65 + oi)}
                    </span>
                    <span class="text-sm font-medium {opt.is_correct ? 'text-emerald-900' : 'text-slate-600'}">{opt.text}</span>
                  </div>
                {/each}
              </div>
            </div>

            <div class="mt-8 flex justify-between border-t border-slate-50 pt-5">
              <button disabled={currentIndex === 0} onclick={() => { currentIndex--; }}
                class="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 transition hover:text-indigo-600 disabled:opacity-0">
                <ChevronLeft size={14} /> Câu trước
              </button>
              <button disabled={currentIndex === questions.length - 1} onclick={() => { currentIndex++; }}
                class="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 transition hover:text-indigo-600 disabled:opacity-0">
                Câu sau <ChevronRight size={14} />
              </button>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  select { -webkit-appearance: none; -moz-appearance: none; appearance: none; }
</style>
