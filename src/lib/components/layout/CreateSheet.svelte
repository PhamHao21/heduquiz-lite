<!-- src/lib/components/layout/CreateSheet.svelte -->
<!-- Chọn cách tạo đề: soạn tay, nhập từ file, hoặc AI (đang tạm dừng). -->
<script lang="ts">
  import { PenLine, FileUp, Sparkles, X } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  const { open, onClose }: { open: boolean; onClose: () => void } = $props();

  const options = [
    { href: '/tao-de', icon: PenLine, title: 'Soạn đề', desc: 'Dán văn bản, hệ thống tự nhận câu hỏi và đáp án.' },
    { href: '/tao-de?nhap=file', icon: FileUp, title: 'Nhập từ file', desc: 'Word, PDF hoặc TXT. Nhận đáp án in đậm, gạch chân.' }
  ];

  async function go(href: string) {
    onClose();
    await goto(href);
  }

  function onKeydown(e: KeyboardEvent) {
    if (open && e.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <div class="fixed inset-0 z-[150] flex items-end justify-center sm:items-center sm:p-4">
    <button class="absolute inset-0 bg-black/45 backdrop-blur-[2px]" aria-label="Đóng" tabindex="-1" onclick={onClose}></button>
    <div class="card rise-in relative w-full max-w-md rounded-b-none p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-2xl sm:pb-5"
      role="dialog" aria-modal="true" aria-labelledby="create-title">
      <div class="mb-4 flex items-center justify-between">
        <h2 id="create-title" class="text-lg font-bold">Tạo đề mới</h2>
        <button class="btn btn-ghost btn-icon" onclick={onClose} aria-label="Đóng"><X size={18} /></button>
      </div>
      <div class="space-y-2">
        {#each options as o (o.href)}
          <button onclick={() => go(o.href)}
            class="flex w-full items-start gap-3.5 rounded-xl border border-line p-4 text-left transition hover:border-accent hover:bg-accent-soft/50">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent"><o.icon size={20} /></span>
            <span>
              <span class="block font-semibold text-ink">{o.title}</span>
              <span class="mt-0.5 block text-sm text-muted">{o.desc}</span>
            </span>
          </button>
        {/each}
        <div class="flex w-full items-start gap-3.5 rounded-xl border border-dashed border-line p-4 opacity-70" aria-disabled="true">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sunken text-muted"><Sparkles size={20} /></span>
          <span>
            <span class="flex items-center gap-2 font-semibold text-ink">Tạo bằng AI <span class="tag">Tạm dừng</span></span>
            <span class="mt-0.5 block text-sm text-muted">Đang nâng cấp, sẽ sớm quay lại.</span>
          </span>
        </div>
      </div>
    </div>
  </div>
{/if}
