<!-- src/lib/components/channel/SubjectGrid.svelte -->
<script lang="ts">
  interface Props {
    subjects: string[];
    active: string;
    onselect: (s: string) => void;
  }

  const { subjects, active, onselect }: Props = $props();
</script>

{#if subjects.length > 0}
  <div class="mb-5 flex flex-wrap gap-2">
    <button
      onclick={() => onselect('')}
      class="rounded-full px-3 py-1 text-xs font-medium transition
        {active === '' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}"
    >
      Tất cả
    </button>
    {#each subjects as s (s.toString)}
      <button
        onclick={() => onselect(s)}
        class="rounded-full px-3 py-1 text-xs font-medium transition
          {active === s ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}"
      >
        {s}
      </button>
    {/each}
  </div>
{/if}
