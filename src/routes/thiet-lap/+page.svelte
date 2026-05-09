<!-- src/routes/thiet-lap/+page.svelte -->
<script lang="ts">
  import { authStore } from '$lib/stores/auth.svelte';
  import { goto } from '$app/navigation';

  $effect(() => {
    if (!authStore.loading && !authStore.isAuthed) goto('/auth');
  });

  let displayName = $state(authStore.user?.user_metadata?.full_name ?? '');
  let bio         = $state('');
  let saving      = $state(false);
  let saved       = $state(false);
  let saveError   = $state('');

  async function handleSave() {
    saving = true; saved = false; saveError = '';
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName, bio })
      });
      if (!res.ok) throw new Error(await res.text());
      saved = true;
      setTimeout(() => { saved = false; }, 2500);
    } catch (e: unknown) {
      saveError = e instanceof Error ? e.message : 'Lỗi lưu';
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head><title>Thiết lập — HeduQuiz</title></svelte:head>

<div class="mx-auto max-w-lg space-y-6 py-8">
  <h1 class="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Thiết lập tài khoản</h1>

  <div class="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm space-y-5">
    <div class="space-y-2">
      <label class="text-[10px] font-black uppercase text-slate-400" for="dn">Tên hiển thị</label>
      <input
        id="dn"
        type="text"
        bind:value={displayName}
        class="w-full rounded-xl border border-transparent bg-slate-50 px-5 py-3 font-bold text-slate-700 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      />
    </div>
    <div class="space-y-2">
      <label class="text-[10px] font-black uppercase text-slate-400" for="bio">Tiểu sử</label>
      <textarea
        id="bio"
        bind:value={bio}
        rows="3"
        placeholder="Giới thiệu về bạn…"
        class="w-full resize-none rounded-xl border border-transparent bg-slate-50 px-5 py-3 font-bold text-slate-700 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      ></textarea>
    </div>

    {#if saveError}<p class="text-sm font-medium text-red-500">{saveError}</p>{/if}
    {#if saved}<p class="text-sm font-medium text-emerald-500">✓ Đã lưu thay đổi</p>{/if}

    <button
      onclick={handleSave}
      disabled={saving}
      class="w-full rounded-2xl bg-indigo-600 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 disabled:opacity-50"
    >
      {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
    </button>
  </div>

  <div class="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
    <h2 class="mb-3 font-black uppercase tracking-tighter text-slate-800">Tài khoản</h2>
    <p class="text-sm text-slate-500">
      Google: <span class="font-bold text-slate-700">{authStore.user?.email}</span>
    </p>
    <button
      onclick={() => authStore.signOut()}
      class="mt-4 rounded-2xl bg-red-50 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-red-600 transition-all hover:bg-red-100"
    >
      Đăng xuất
    </button>
  </div>
</div>
