<!-- src/lib/components/layout/Footer.svelte -->
<script lang="ts">
  import Logo from './Logo.svelte';
</script>

<footer class="no-print mt-16 border-t border-line pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
  <div class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
    <div>
      <Logo />
      <p class="mt-1 text-sm text-muted">Tạo đề trắc nghiệm và ôn thi miễn phí.</p>
    </div>
    <nav class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted" aria-label="Liên kết cuối trang">
      <a href="/kham-pha" class="hover:text-ink">Khám phá</a>
      <a href="/xep-hang" class="hover:text-ink">Xếp hạng</a>
      <a href="/tao-de" class="hover:text-ink">Tạo đề</a>
      <span class="text-faint">© {new Date().getFullYear()} HeduQuiz</span>
    </nav>
  </div>
</footer>
