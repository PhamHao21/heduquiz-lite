<!-- src/routes/thiet-lap/+page.svelte -->
<script lang="ts">
  import { Sun, Moon, Monitor, LogOut, ExternalLink } from 'lucide-svelte';
  import { invalidateAll, goto } from '$app/navigation';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import { themeStore, type ThemePref } from '$lib/stores/theme.svelte';
  import { authStore } from '$lib/stores/auth.svelte';
  import { toast } from '$lib/stores/toast.svelte';

  const { data } = $props();

  // Giá trị ban đầu của form (lấy một lần từ server)
  const initial = (() => data.me)();
  let displayName = $state(initial.display_name ?? '');
  let username    = $state(initial.username ?? '');
  let bio         = $state(initial.bio ?? '');
  let saving      = $state(false);
  let formError   = $state('');

  const usernameValid = $derived(/^[a-z0-9](?:[a-z0-9._]{1,28}[a-z0-9])$/.test(username.trim().toLowerCase()));
  const canSave = $derived(!saving && displayName.trim().length > 0 && usernameValid && bio.length <= 300);

  async function save(e: SubmitEvent) {
    e.preventDefault();
    if (!canSave) return;
    saving = true;
    formError = '';
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName, username: username.trim().toLowerCase(), bio })
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? `Lỗi ${res.status}`);
      await invalidateAll();
      toast.success('Đã lưu hồ sơ');
    } catch (err) {
      formError = err instanceof Error ? err.message : 'Lỗi không xác định';
    } finally {
      saving = false;
    }
  }

  async function signOut() {
    await authStore.signOut();
    await invalidateAll();
    await goto('/');
  }

  const themes: { value: ThemePref; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Sáng', icon: Sun },
    { value: 'dark', label: 'Tối', icon: Moon },
    { value: 'system', label: 'Theo máy', icon: Monitor }
  ];
</script>

<svelte:head><title>Thiết lập · HeduQuiz</title></svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
  <h1 class="text-2xl font-extrabold tracking-tight">Thiết lập</h1>

  <!-- Hồ sơ -->
  <form class="card space-y-5 p-6" onsubmit={save}>
    <div class="flex items-center gap-4">
      <Avatar name={displayName || username} src={data.me.avatar_url} size={56} />
      <div class="min-w-0">
        <p class="font-bold">Hồ sơ công khai</p>
        <p class="text-sm text-muted">Ảnh đại diện lấy từ tài khoản Google của bạn.</p>
      </div>
      {#if data.me.username}
        <a href="/u/{data.me.username}" class="btn btn-ghost btn-sm ml-auto shrink-0">Xem trang <ExternalLink size={14} /></a>
      {/if}
    </div>

    <div>
      <label class="label" for="display-name">Tên hiển thị</label>
      <input id="display-name" class="input" bind:value={displayName} maxlength="60" required />
    </div>

    <div>
      <label class="label" for="username">Tên người dùng</label>
      <div class="flex items-center rounded-xl border border-line bg-sunken focus-within:border-accent">
        <span class="pl-3.5 text-sm text-muted">/u/</span>
        <input id="username" class="w-full bg-transparent px-1 py-2.5 text-sm text-ink outline-none" bind:value={username}
          maxlength="30" autocomplete="off" spellcheck="false" aria-describedby="username-hint" />
      </div>
      <p id="username-hint" class="hint {username && !usernameValid ? 'text-danger' : ''}">
        3-30 ký tự: chữ thường không dấu, số, dấu chấm hoặc gạch dưới.
      </p>
    </div>

    <div>
      <label class="label" for="bio">Giới thiệu</label>
      <textarea id="bio" class="input min-h-24 resize-y" bind:value={bio} maxlength="300"
        placeholder="Ví dụ: Sinh viên năm 2, đang ôn thi chứng chỉ tiếng Anh."></textarea>
      <p class="hint text-right">{bio.length}/300</p>
    </div>

    {#if formError}<p class="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">{formError}</p>{/if}

    <div class="flex justify-end">
      <button class="btn btn-primary" disabled={!canSave}>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
    </div>
  </form>

  <!-- Giao diện -->
  <section class="card p-6">
    <p class="font-bold">Giao diện</p>
    <p class="mt-1 text-sm text-muted">Lựa chọn được lưu trên thiết bị này.</p>
    <div class="segmented mt-4" role="group" aria-label="Chọn giao diện">
      {#each themes as t (t.value)}
        <button aria-pressed={themeStore.pref === t.value} onclick={() => themeStore.set(t.value)}>
          <t.icon size={15} /> {t.label}
        </button>
      {/each}
    </div>
  </section>

  <!-- Tài khoản -->
  <section class="card flex flex-wrap items-center gap-4 p-6">
    <div class="min-w-0 flex-1">
      <p class="font-bold">Tài khoản</p>
      <p class="truncate text-sm text-muted">Đăng nhập bằng Google: {data.email}</p>
    </div>
    <button onclick={signOut} class="btn btn-secondary hover:border-danger hover:text-danger"><LogOut size={16} /> Đăng xuất</button>
  </section>
</div>
