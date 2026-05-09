<!-- src/lib/components/ui/Card.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  interface Props {
    class?: string;
    children: Snippet;
  }
  const { class: cls = '', children }: Props = $props();
</script>

<div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 {cls}">
  {@render children()}
</div>
