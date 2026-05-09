<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';

  const { children } = $props();
</script>

<div class="flex min-h-screen flex-col bg-slate-50">
  <Header />
  <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
    {@render children()}
  </main>
  <Footer />
</div>
