<!-- src/lib/components/ui/Button.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    type?: 'button' | 'submit' | 'reset';
    onclick?: () => void;
    children: Snippet;
  }

  const {
    variant  = 'primary',
    size     = 'md',
    disabled = false,
    loading  = false,
    type     = 'button',
    onclick,
    children
  }: Props = $props();

  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants: Record<string, string> = {
    primary:   'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
    danger:    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    ghost:     'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
  };

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
</script>

<button
  {type}
  disabled={disabled || loading}
  {onclick}
  class="{base} {variants[variant]} {sizes[size]}"
>
  {#if loading}
    <svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  {/if}
  {@render children()}
</button>
