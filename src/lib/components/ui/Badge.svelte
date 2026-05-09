<!-- src/lib/components/ui/Badge.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  interface Props {
    variant?: 'indigo' | 'emerald' | 'amber' | 'red' | 'slate';
    children: Snippet;
  }
  const { variant = 'indigo', children }: Props = $props();

  const variants: Record<string, string> = {
    indigo:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    amber:   'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    red:     'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
    slate:   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
  };
</script>

<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold {variants[variant]}">
  {@render children()}
</span>
