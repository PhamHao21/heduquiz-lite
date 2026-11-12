<!-- src/lib/components/ui/Avatar.svelte -->
<script lang="ts">
  interface Props { name?: string | null; src?: string | null; size?: number; class?: string }
  const { name = '', src = null, size = 36, class: klass = '' }: Props = $props();

  let failed = $state(false);
  const initial = $derived((name ?? '').trim().charAt(0).toUpperCase() || '?');
</script>

{#if src && !failed}
  <img
    {src}
    alt=""
    width={size}
    height={size}
    referrerpolicy="no-referrer"
    onerror={() => { failed = true; }}
    class="shrink-0 rounded-full object-cover ring-1 ring-line {klass}"
    style="width:{size}px;height:{size}px;"
  />
{:else}
  <span
    class="inline-flex shrink-0 items-center justify-center rounded-full bg-brand font-bold text-on-brand {klass}"
    style="width:{size}px;height:{size}px;font-size:{Math.round(size * 0.42)}px;"
    aria-hidden="true"
  >{initial}</span>
{/if}
