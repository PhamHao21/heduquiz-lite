<!-- src/routes/kho-de/+page.svelte -->
<script lang="ts">
  import { FileText, Trash2, Globe, Lock, Clock, BookOpen, Plus, Search } from 'lucide-svelte';
  import { authStore } from '$lib/stores/auth.svelte';
  import { invalidateAll } from '$app/navigation';
  import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';

  const { data } = $props();

  interface Quiz {
    id: string; title: string; subject: string | null;
    is_public: boolean; play_count: number;
    created_at: string; updated_at: string;
  }

  const quizzes = $derived(data.quizzes as Quiz[]);
  const stats   = $derived(data.stats ?? { totalQuizzes: 0, totalAttempts: 0 });

  let search       = $state('');
  let deleteTarget = $state<Quiz | null>(null);   // quiz đang chờ xác nhận xóa
  let deleting     = $state(false);

  const filtered = $derived(
    search.trim()
      ? quizzes.filter(q =>
          q.title.toLowerCase().includes(search.toLowerCase()) ||
          (q.subject ?? '').toLowerCase().includes(search.toLowerCase()))
      : quizzes
  );

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('vi-VN');
  }

  async function togglePublic(q: Quiz) {
    await fetch('/api/quizzes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: q.id, is_public: !q.is_public })
    });
    await invalidateAll();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    deleting = true;
    await fetch('/api/quizzes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteTarget.id })
    });
    deleting     = false;
    deleteTarget = null;
    await invalidateAll();
  }
</script>

<svelte:head><title>Kho đề — HeduQuiz</title></svelte:head>

<!-- ConfirmModal xóa đề -->
<ConfirmModal
  open={deleteTarget !== null}
  title="Xóa đề thi?"
  message={deleteTarget ? `Bạn sắp xóa "${deleteTarget.title}". Toàn bộ câu hỏi và lịch sử ôn thi sẽ bị xóa vĩnh viễn.` : ''}
  confirmLabel="Xóa vĩnh viễn"
  danger={true}
  loading={deleting}
  onConfirm={confirmDelete}
  onCancel={() => { deleteTarget = null; }}
/>

<div class="mx-auto max-w-5xl space-y-7" style="color:#1e293b;">

  <!-- Greeting + stats -->
  <div class="rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-indigo-800 p-7 text-white shadow-xl shadow-indigo-100">
    <p class="text-sm font-bold text-indigo-200">
      Xin chào, <span class="text-white">{authStore.user?.user_metadata?.full_name ?? authStore.user?.email?.split('@')[0]}</span> 👋
    </p>
    <h1 class="mt-1 text-2xl font-black uppercase tracking-tight">Kho đề của bạn</h1>
    <div class="mt-5 flex flex-wrap gap-4">
      <div class="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
        <FileText size={18} class="text-indigo-200" />
        <div>
          <p class="text-xl font-black">{stats.totalQuizzes}</p>
          <p class="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Đề thi</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
        <BookOpen size={18} class="text-indigo-200" />
        <div>
          <p class="text-xl font-black">{stats.totalAttempts}</p>
          <p class="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Lượt ôn</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Toolbar -->
  <div class="flex flex-wrap items-center gap-3">
    <div class="relative flex-1 min-w-0">
      <Search size={16} class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
      <input type="search" bind:value={search} placeholder="Tìm đề của bạn..."
        class="w-full rounded-2xl border py-3 pl-10 pr-4 text-sm font-medium shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-400/30"
        style="background:#ffffff;color:#1e293b;border-color:#e2e8f0;" />
    </div>
    <a href="/tao-de"
      class="flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black uppercase tracking-wider text-white shadow-md hover:bg-indigo-700 transition-all whitespace-nowrap">
      <Plus size={16} strokeWidth={3} /> Tạo mới
    </a>
  </div>

  <!-- Empty state -->
  {#if quizzes.length === 0}
    <div class="flex flex-col items-center justify-center rounded-[2.5rem] border-4 border-dashed border-slate-200 py-20 text-center">
      <FileText size={40} class="mb-4 text-slate-300" />
      <p class="font-bold" style="color:#94a3b8;">Chưa có đề thi nào</p>
      <p class="mt-1 text-sm" style="color:#94a3b8;">Tạo đề đầu tiên bằng nút "TẠO ĐỀ" trên thanh nav</p>
    </div>

  {:else if filtered.length === 0}
    <div class="py-12 text-center" style="color:#94a3b8;">Không tìm thấy đề nào khớp với "{search}"</div>

  {:else}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each filtered as q (q.id)}
        <div class="group relative flex flex-col rounded-[2rem] border p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
          style="background:#ffffff;border-color:#f1f5f9;">

          <!-- Badge + visibility toggle -->
          <div class="mb-3 flex items-center justify-between">
            {#if q.subject}
              <span class="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide"
                style="background:#eef2ff;color:#4338ca;">
                {q.subject}
              </span>
            {:else}
              <span></span>
            {/if}
            <button onclick={() => togglePublic(q)}
              title={q.is_public ? 'Công khai — bấm để ẩn' : 'Riêng tư — bấm để công khai'}
              class="rounded-lg p-1.5 transition-all hover:bg-slate-100"
              style="color:{q.is_public ? '#10b981' : '#cbd5e1'};">
              {#if q.is_public}<Globe size={14} />{:else}<Lock size={14} />{/if}
            </button>
          </div>

          <!-- Title -->
          <h3 class="mb-3 flex-1 text-base font-black leading-snug line-clamp-2" style="color:#0f172a;">
            {q.title}
          </h3>

          <!-- Meta -->
          <p class="mb-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide" style="color:#94a3b8;">
            <Clock size={11} /> {formatDate(q.updated_at)}
            <span class="mx-1">·</span>
            <BookOpen size={11} /> {q.play_count} lượt
          </p>

          <!-- Actions -->
          <div class="flex gap-2">
            <a href="/quiz/{q.id}"
              class="flex-1 rounded-xl py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-white transition-all group-hover:bg-indigo-600"
              style="background:#0f172a;">
              Ôn thi
            </a>
            <a href="/tao-de?edit={q.id}" title="Sửa đề"
              class="rounded-xl border p-2.5 transition-all hover:border-indigo-200"
              style="border-color:#f1f5f9;color:#94a3b8;">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </a>
            <!-- Nút xóa: mở ConfirmModal thay vì double-click -->
            <button
              onclick={() => { deleteTarget = q; }}
              title="Xóa đề"
              class="rounded-xl border p-2.5 transition-all hover:border-red-200"
              style="border-color:#f1f5f9;color:#94a3b8;">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>