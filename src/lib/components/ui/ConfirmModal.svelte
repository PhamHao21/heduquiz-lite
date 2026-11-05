<!-- src/lib/components/ui/ConfirmModal.svelte -->
<script lang="ts">
  import { AlertTriangle, HelpCircle } from 'lucide-svelte';

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
    open = false,
    title = 'Xác nhận',
    message = 'Bạn có chắc chắn không?',
    confirmLabel = 'Xác nhận',
    cancelLabel = 'Hủy',
    danger = false,
    loading = false,
    onConfirm,
    onCancel
  }: Props = $props();

  let dialog = $state<HTMLDivElement>();

  $effect(() => {
    if (open) dialog?.querySelector<HTMLButtonElement>('[data-autofocus]')?.focus();
  });

  function onKeydown(e: KeyboardEvent) {
    if (open && e.key === 'Escape' && !loading) onCancel();
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <div class="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center">
    <button
      class="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      aria-label="Đóng"
      tabindex="-1"
      onclick={() => { if (!loading) onCancel(); }}
    ></button>
    <div
      bind:this={dialog}
      class="card rise-in relative w-full max-w-sm p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div class="mb-4 flex h-11 w-11 items-center justify-center rounded-xl {danger ? 'bg-danger-soft text-danger' : 'bg-accent-soft text-accent'}">
        {#if danger}<AlertTriangle size={22} />{:else}<HelpCircle size={22} />{/if}
      </div>
      <h2 id="confirm-title" class="text-lg font-bold text-ink">{title}</h2>
      <p class="mt-1.5 text-sm leading-relaxed text-muted">{message}</p>
      <div class="mt-6 grid grid-cols-2 gap-2">
        <button class="btn btn-secondary" onclick={onCancel} disabled={loading}>{cancelLabel}</button>
        <button class="btn {danger ? 'btn-danger' : 'btn-primary'}" onclick={onConfirm} disabled={loading} data-autofocus>
          {loading ? 'Đang xử lý…' : confirmLabel}
        </button>
      </div>
    </div>
  </div>
{/if}
