<!-- src/lib/components/Header.svelte -->
<script lang="ts">
  import { Plus, BookOpen } from 'lucide-svelte';
  import { page } from '$app/state';
  import { authStore } from '$lib/stores/auth.svelte';

  const activeRoute = $derived(page.url.pathname);
  let modalOpen    = $state(false);
  let showAiNotice = $state(false);

  function openModal() {
    if (!authStore.isAuthed) { window.location.href = '/auth'; return; }
    modalOpen = true;
  }

  async function navigateToCreate(path: string) {
    modalOpen = false;
    if (page.url.pathname === '/tao-de') {
      window.location.href = path;
    } else {
      const { goto } = await import('$app/navigation');
      await goto(path);
    }
  }

  function handleAiClick() {
    modalOpen    = false;
    showAiNotice = true;
  }
</script>

<nav class="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
  <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
    <div class="flex items-center gap-5">
      <a href={authStore.isAuthed ? '/kho-de' : '/'} class="text-xl font-black tracking-tighter text-indigo-600">
        HEDU<span class="text-orange-500">.</span>
      </a>
      {#if authStore.isAuthed}
        <a href="/kho-de"
          class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition-all
            {activeRoute.startsWith('/kho-de') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}">
          <BookOpen size={16} /> KHO ĐỀ
        </a>
      {/if}
    </div>

    <div class="flex items-center gap-2">
      {#if authStore.isAuthed}
        <button onclick={openModal} aria-label="Tạo đề thi mới"
          class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-indigo-600 px-4 py-2 text-sm font-black text-white shadow-md transition-all hover:scale-105 active:scale-95">
          <Plus size={18} strokeWidth={3} />
          <span class="hidden sm:inline">TẠO ĐỀ</span>
        </button>
        <a href="/thiet-lap" aria-label="Thiết lập tài khoản"
          class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-indigo-100 bg-slate-100 transition-all hover:border-indigo-300">
          {#if authStore.user?.user_metadata?.avatar_url}
            <img src={authStore.user.user_metadata.avatar_url} alt="avatar"
              class="h-full w-full object-cover" referrerpolicy="no-referrer" />
          {:else}
            <span class="text-sm font-black text-indigo-600">
              {(authStore.user?.email ?? 'U')[0].toUpperCase()}
            </span>
          {/if}
        </a>
      {:else}
        <a href="/auth" class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-700 transition-all">
          Đăng nhập
        </a>
      {/if}
    </div>
  </div>
</nav>

<!-- ── Modal chọn loại tạo đề ── -->
{#if modalOpen}
  <button class="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm"
    onclick={() => { modalOpen = false; }} aria-label="Đóng modal"></button>

  <div class="fixed left-1/2 top-1/2 z-[101] w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[2rem] p-7 shadow-2xl"
    style="background:#ffffff;color:#1e293b;">
    <div class="mb-5 flex items-center justify-between">
      <h2 class="text-xl font-black uppercase tracking-tight" style="color:#0f172a;">Tạo đề thi</h2>
      <button onclick={() => { modalOpen = false; }} aria-label="Đóng"
        class="rounded-full p-1.5 transition-colors hover:bg-slate-100" style="color:#94a3b8;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <button onclick={() => navigateToCreate('/tao-de')}
        class="group flex w-full flex-col items-center gap-3 rounded-[1.5rem] border-2 p-5 transition-all hover:border-indigo-400 hover:bg-indigo-50"
        style="border-color:#f1f5f9;background:#ffffff;">
        <div class="rounded-2xl p-3 transition-transform group-hover:scale-110" style="background:#eef2ff;color:#4f46e5;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div class="text-center">
          <p class="font-black uppercase text-sm" style="color:#0f172a;">Thủ công</p>
          <p class="mt-0.5 text-[10px]" style="color:#94a3b8;">Nhập text, parser tự xử lý</p>
        </div>
      </button>

      <!-- AI: mở notice thay vì navigate -->
      <button onclick={handleAiClick}
        class="group relative flex w-full flex-col items-center gap-3 overflow-hidden rounded-[1.5rem] border-2 p-5 transition-all hover:border-pink-400 hover:bg-pink-50"
        style="border-color:#f1f5f9;background:#ffffff;">
        <span class="absolute right-2.5 top-2.5 rounded-full px-1.5 py-0.5 text-[9px] font-black text-white" style="background:#ec4899;">AI</span>
        <div class="rounded-2xl p-3 transition-transform group-hover:scale-110" style="background:#fce7f3;color:#db2777;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
            <path d="M19 3v4"/><path d="M21 5h-4"/>
          </svg>
        </div>
        <div class="text-center">
          <p class="font-black uppercase text-sm" style="color:#0f172a;">Dùng AI</p>
          <p class="mt-0.5 text-[10px]" style="color:#94a3b8;">Gemini tự tạo từ chủ đề</p>
        </div>
      </button>
    </div>
  </div>
{/if}

<!-- ── Modal AI chưa hoàn thiện ── -->
{#if showAiNotice}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-[200] flex items-center justify-center p-4"
    style="background:rgba(15,23,42,0.65);backdrop-filter:blur(6px);"
    onclick={(e) => { if (e.target === e.currentTarget) showAiNotice = false; }}
    onkeydown={(e) => { if (e.key === 'Escape') showAiNotice = false; }}>

    <div class="w-full max-w-sm rounded-[2rem] p-8 shadow-2xl text-center" style="background:#ffffff;color:#1e293b;">
      <!-- Animated icon -->
      <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
        style="background:linear-gradient(135deg,#fce7f3,#eef2ff);">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
          fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <defs>
            <linearGradient id="ai-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ec4899"/>
              <stop offset="100%" stop-color="#6366f1"/>
            </linearGradient>
          </defs>
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" stroke="url(#ai-grad)"/>
          <path d="M19 3v4" stroke="url(#ai-grad)"/>
          <path d="M21 5h-4" stroke="url(#ai-grad)"/>
        </svg>
      </div>

      <h2 class="text-xl font-black" style="color:#0f172a;">Tính năng AI tạm dừng</h2>
      <p class="mt-3 text-sm leading-relaxed" style="color:#64748b;">
        Tính năng tạo đề bằng AI đang được nâng cấp và sẽ sớm quay lại.<br><br>
        Bạn có thể dùng <strong style="color:#4338ca;">Tạo thủ công</strong> — nhập nội dung đề và parser sẽ tự nhận diện câu hỏi, đáp án.
      </p>

      <div class="mt-6 flex flex-col gap-2.5">
        <button onclick={() => { showAiNotice = false; navigateToCreate('/tao-de'); }}
          class="w-full rounded-2xl py-3 text-sm font-black text-white transition hover:opacity-90"
          style="background:#4f46e5;">
          Tạo đề thủ công →
        </button>
        <button onclick={() => { showAiNotice = false; }}
          class="w-full rounded-2xl border py-3 text-sm font-bold transition hover:bg-slate-50"
          style="border-color:#e2e8f0;color:#64748b;background:#ffffff;">
          Đóng
        </button>
      </div>
    </div>
  </div>
{/if}