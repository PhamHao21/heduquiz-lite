<!-- src/routes/+error.svelte -->
<script lang="ts">
  import { page } from '$app/state';
  import { SearchX, ShieldAlert, CloudOff } from 'lucide-svelte';

  const status = $derived(page.status);
  const title = $derived(
    status === 404 ? 'Không tìm thấy trang' :
    status === 401 || status === 403 ? 'Bạn không có quyền xem trang này' :
    'Đã có lỗi xảy ra'
  );
  const Icon = $derived(status === 404 ? SearchX : status === 401 || status === 403 ? ShieldAlert : CloudOff);
</script>

<svelte:head><title>{status} · HeduQuiz</title></svelte:head>

<div class="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center text-center">
  <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-sunken text-muted"><Icon size={26} /></div>
  <p class="mt-6 font-mono text-sm font-semibold text-faint">Lỗi {status}</p>
  <h1 class="mt-1 text-2xl font-extrabold tracking-tight">{title}</h1>
  {#if page.error?.message && page.error.message !== title && page.error.message !== 'Not Found'}
    <p class="mt-2 text-sm text-muted">{page.error.message}</p>
  {/if}
  <div class="mt-8 flex gap-2">
    <button onclick={() => history.back()} class="btn btn-secondary">Quay lại</button>
    <a href={page.data.profile ? '/kho-de' : '/'} class="btn btn-primary">Về trang chính</a>
  </div>
</div>
