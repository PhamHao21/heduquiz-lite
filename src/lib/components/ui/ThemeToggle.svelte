<!-- src/lib/components/ui/ThemeToggle.svelte -->
<script lang="ts">
  import { Moon, Sun } from 'lucide-svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
</script>

<button
  class="btn btn-ghost btn-icon"
  onclick={() => themeStore.toggle()}
  aria-label={themeStore.isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
  title={themeStore.isDark ? 'Giao diện sáng' : 'Giao diện tối'}
>
  {#if themeStore.isDark}<Sun size={18} />{:else}<Moon size={18} />{/if}
</button>
