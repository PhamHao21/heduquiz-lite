<!-- src/routes/+error.svelte -->
<script lang="ts">
  import { page } from '$app/state';

  const status = $derived(page.status);
  const title = $derived(
    status === 404 ? 'Không tìm thấy trang' :
    status === 401 || status === 403 ? 'Bạn không có quyền xem trang này' :
    'Đã có lỗi xảy ra'
  );
</script>

<svelte:head><title>{status} — HeduQuiz</title></svelte:head>

<div class="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center" style="color:#1e293b;">
  <p class="text-7xl font-black tracking-tighter" style="color:#4f46e5;">{status}</p>
  <h1 class="mt-3 text-xl font-black" style="color:#0f172a;">{title}</h1>
  {#if page.error?.message && page.error.message !== title}
    <p class="mt-2 text-sm" style="color:#64748b;">{page.error.message}</p>
  {/if}
  <div class="mt-6 flex gap-3">
    <a href="/kho-de" class="rounded-2xl px-5 py-3 text-sm font-black" style="background:#4f46e5;color:#ffffff;">Về Kho đề</a>
    <button
      onclick={() => history.back()}
      class="rounded-2xl border px-5 py-3 text-sm font-bold"
      style="border-color:#e2e8f0;background:#ffffff;color:#475569;"
    >← Quay lại</button>
  </div>
</div>
