<!-- src/routes/auth/+page.svelte -->
<script lang="ts">
  import { Check } from 'lucide-svelte';
  import { authStore } from '$lib/stores/auth.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { NEXT_COOKIE, safeNext } from '$lib/utils/safeRedirect';
  import Logo from '$lib/components/layout/Logo.svelte';

  // Trang cần quay lại sau khi đăng nhập (VD: /auth?next=/tao-de?edit=...)
  const next = $derived(safeNext(page.url.searchParams.get('next'), '/kho-de'));

  let loading = $state(false);
  let error   = $state(page.url.searchParams.get('error') ? 'Đăng nhập chưa thành công. Vui lòng thử lại.' : '');

  $effect(() => {
    if (authStore.isAuthed) goto(next);
  });

  async function handleGoogleLogin() {
    loading = true;
    error   = '';
    try {
      // Lưu trang cần quay lại vào cookie ngắn hạn; /auth/callback đọc và kiểm tra lại.
      // (Không gắn ?next= vào redirectTo để khỏi phải sửa danh sách Redirect URLs trên Supabase.)
      document.cookie = `${NEXT_COOKIE}=${encodeURIComponent(next)}; path=/; max-age=600; samesite=lax`;
      await authStore.signInWithGoogle();
    } catch {
      error   = 'Đăng nhập chưa thành công. Vui lòng thử lại.';
      loading = false;
    }
  }

  const perks = [
    'Lưu đề và lịch sử ôn thi trên mọi thiết bị',
    'Ôn lại đúng những câu bạn từng làm sai',
    'Ghi tên lên bảng xếp hạng'
  ];
</script>

<svelte:head>
  <title>Đăng nhập · HeduQuiz</title>
</svelte:head>

<div class="mx-auto grid max-w-4xl items-center gap-10 py-4 md:grid-cols-2 md:py-12">
  <div class="card rise-in p-7 sm:p-9">
    <Logo size="lg" />
    <h1 class="mt-8 text-2xl font-extrabold tracking-tight">Đăng nhập</h1>
    <p class="mt-1.5 text-sm text-muted">Dùng tài khoản Google để tiếp tục.</p>

    {#if error}
      <p class="mt-5 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger" role="alert">{error}</p>
    {/if}

    <button onclick={handleGoogleLogin} disabled={loading} class="btn btn-secondary btn-lg mt-6 w-full">
      {#if loading}
        Đang chuyển sang Google…
      {:else}
        <!-- Logo Google (nhận diện thương hiệu chính thức, giữ đúng màu) -->
        <svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Tiếp tục với Google
      {/if}
    </button>

    <p class="mt-6 text-xs leading-relaxed text-faint">
      Không cần đăng nhập vẫn ôn được các đề công khai. <a href="/kham-pha" class="font-semibold text-accent hover:underline">Xem đề công khai</a>
    </p>
  </div>

  <div class="rise-in rise-in-delay-1 hidden md:block">
    <h2 class="text-3xl font-extrabold leading-tight tracking-tight">Học đều mỗi ngày, nhớ lâu hơn.</h2>
    <ul class="mt-6 space-y-3">
      {#each perks as p (p)}
        <li class="flex items-start gap-3 text-muted">
          <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-soft text-success"><Check size={13} strokeWidth={3} /></span>
          {p}
        </li>
      {/each}
    </ul>
  </div>
</div>
