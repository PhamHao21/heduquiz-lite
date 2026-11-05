<!-- src/lib/components/layout/NavProgress.svelte -->
<!-- Thanh mảnh ở đầu trang khi đang chuyển trang (phản hồi cho người dùng khi mạng chậm). -->
<script lang="ts">
  import { navigating } from '$app/state';
  let visible = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    if (navigating.to) {
      // chỉ hiện khi chuyển trang lâu hơn 150ms để khỏi nháy
      timer = setTimeout(() => { visible = true; }, 150);
    } else {
      clearTimeout(timer);
      visible = false;
    }
    return () => clearTimeout(timer);
  });
</script>

{#if visible}
  <div class="fixed inset-x-0 top-0 z-[400] h-0.5 overflow-hidden bg-accent-soft" aria-hidden="true">
    <div class="nav-bar h-full w-1/3 bg-accent"></div>
  </div>
{/if}

<style>
  .nav-bar {
    animation: slide 1.1s ease-in-out infinite;
  }
  @keyframes slide {
    from { transform: translateX(-100%); }
    to { transform: translateX(300%); }
  }
  @media (prefers-reduced-motion: reduce) {
    .nav-bar { animation: none; width: 100%; }
  }
</style>
