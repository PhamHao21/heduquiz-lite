<!-- src/lib/components/ui/EmptyState.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Icon as LucideIcon } from 'lucide-svelte';
  interface Props { icon: typeof LucideIcon; title: string; description?: string; children?: Snippet }
  const { icon: Icon, title, description, children }: Props = $props();
</script>

<div class="flex flex-col items-center rounded-2xl border border-dashed border-line-strong px-6 py-14 text-center">
  <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sunken text-muted">
    <Icon size={22} />
  </div>
  <p class="font-semibold text-ink">{title}</p>
  {#if description}<p class="mt-1 max-w-sm text-sm text-muted">{description}</p>{/if}
  {#if children}<div class="mt-5">{@render children()}</div>{/if}
</div>
