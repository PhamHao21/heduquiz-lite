<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/layout/Header.svelte';
  import BottomNav from '$lib/components/layout/BottomNav.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';
  import CreateSheet from '$lib/components/layout/CreateSheet.svelte';
  import NavProgress from '$lib/components/layout/NavProgress.svelte';
  import Toaster from '$lib/components/ui/Toaster.svelte';
  import '$lib/stores/theme.svelte';

  const { children } = $props();
  let createOpen = $state(false);
</script>

<NavProgress />
<div class="flex min-h-[100dvh] flex-col">
  <Header onCreate={() => { createOpen = true; }} />
  <main class="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-12 sm:px-6 sm:pt-10">
    {@render children()}
  </main>
  <Footer />
</div>
<BottomNav onCreate={() => { createOpen = true; }} />
<CreateSheet open={createOpen} onClose={() => { createOpen = false; }} />
<Toaster />
