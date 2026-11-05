<!-- src/lib/components/ui/Toaster.svelte -->
<script lang="ts">
  import { CheckCircle2, AlertCircle, Info, X } from 'lucide-svelte';
  import { toast } from '$lib/stores/toast.svelte';

  const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
  const tone = {
    success: 'text-success',
    error: 'text-danger',
    info: 'text-accent'
  };
</script>

<div
  class="pointer-events-none fixed inset-x-0 bottom-20 z-[300] flex flex-col items-center gap-2 px-4 sm:bottom-6"
  aria-live="polite"
  role="status"
>
  {#each toast.items as t (t.id)}
    {@const Icon = icons[t.kind]}
    <div class="card rise-in pointer-events-auto flex w-full max-w-sm items-start gap-3 px-4 py-3 text-sm shadow-lg">
      <Icon size={18} class="mt-0.5 shrink-0 {tone[t.kind]}" />
      <p class="flex-1 text-ink">{t.text}</p>
      <button class="text-faint hover:text-ink" onclick={() => toast.dismiss(t.id)} aria-label="Đóng thông báo">
        <X size={16} />
      </button>
    </div>
  {/each}
</div>
