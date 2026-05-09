<!-- src/lib/components/ui/Modal.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    open: boolean;
    title?: string;
    onclose: () => void;
    children: Snippet;
  }

  const { open, title, onclose, children }: Props = $props();

  function onBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) onclose();
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onclose();
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <!-- Backdrop -->
  <div
    role="dialog"
    aria-modal="true"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    onclick={onBackdrop}
  >
    <!-- Panel -->
    <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
      {#if title}
        <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 class="font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
          <button
            onclick={onclose}
            class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
      {/if}
      <div class="p-6">
        {@render children()}
      </div>
    </div>
  </div>
{/if}
