<!-- src/lib/components/layout/Logo.svelte -->
<script lang="ts">
  const { href = '/', size = 'md' }: { href?: string; size?: 'md' | 'lg' } = $props();
</script>

<a {href} class="inline-flex items-baseline font-extrabold tracking-tight text-ink {size === 'lg' ? 'text-3xl' : 'text-xl'}" aria-label="HeduQuiz, về trang chính">
  HEDU<span class="text-[#f26a1b]">.</span>
</a>
