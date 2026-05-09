<!-- src/lib/components/ui/ConfirmModal.svelte -->
<!--
  Cách dùng:
  <ConfirmModal
    open={showConfirm}
    title="Xóa đề thi?"
    message="Hành động này không thể hoàn tác."
    confirmLabel="Xóa"
    danger={true}
    onConfirm={() => handleDelete()}
    onCancel={() => { showConfirm = false; }}
  />
-->
<script lang="ts">
  interface Props {
    open: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;        
    loading?: boolean;      
    onConfirm: () => void;
    onCancel: () => void;
  }

  const {
    open         = false,
    title        = 'Xác nhận',
    message      = 'Bạn có chắc chắn không?',
    confirmLabel = 'Xác nhận',
    cancelLabel  = 'Hủy',
    danger       = false,
    loading      = false,
    onConfirm,
    onCancel
  }: Props = $props();

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && !loading) onCancel();
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[200] flex items-center justify-center p-4"
    style="background:rgba(15,23,42,0.6);backdrop-filter:blur(4px);"
    onclick={(e) => { if (e.target === e.currentTarget && !loading) onCancel(); }}
    onkeydown={(e) => { if (e.key === 'Escape' && !loading) onCancel(); }}
  >
    <div
      class="w-full max-w-sm rounded-[2rem] p-7 shadow-2xl"
      style="background:#ffffff;color:#1e293b;"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div class="mb-5 flex justify-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl"
          style="background:{danger ? '#fef2f2' : '#eef2ff'};">
          {#if danger}
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
              fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
              fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          {/if}
        </div>
      </div>

      <h2 id="confirm-title" class="mb-2 text-center text-lg font-black" style="color:#0f172a;">{title}</h2>
      <p class="text-center text-sm leading-relaxed" style="color:#64748b;">{message}</p>

      <div class="mt-6 flex gap-3">
        <button
          onclick={onCancel}
          disabled={loading}
          class="flex-1 rounded-2xl border py-3 text-sm font-bold transition hover:opacity-80 disabled:opacity-40"
          style="border-color:#e2e8f0;background:#ffffff;color:#475569;"
        >
          {cancelLabel}
        </button>
        <button
          onclick={onConfirm}
          disabled={loading}
          class="flex-1 rounded-2xl py-3 text-sm font-black text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
          style="background:{danger ? '#dc2626' : '#4f46e5'};box-shadow:{danger ? '0 4px 14px #dc262630' : '0 4px 14px #4f46e530'};"
        >
          {#if loading}
            <svg class="mx-auto h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          {:else}
            {confirmLabel}
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}