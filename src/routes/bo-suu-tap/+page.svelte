<!-- src/routes/bo-suu-tap/+page.svelte -->
<script lang="ts">
  import { Bookmark, Plus, LogIn, DatabaseZap, Compass } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import CollectionCard from '$lib/components/collections/CollectionCard.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import { createCollection } from '$lib/supabase/collections';
  import { toast } from '$lib/stores/toast.svelte';

  const { data } = $props();

  let showForm = $state(false);
  let title = $state('');
  let description = $state('');
  let isPublic = $state(true);
  let saving = $state(false);

  async function create(e: SubmitEvent) {
    e.preventDefault();
    const me = page.data.profile;
    if (!me || !title.trim() || saving) return;
    saving = true;
    try {
      const id = await createCollection(me.id, title, isPublic, description);
      toast.success('Đã tạo bộ sưu tập');
      await goto(`/bo-suu-tap/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tạo được bộ sưu tập');
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head><title>Bộ sưu tập · HeduQuiz</title></svelte:head>

<div class="space-y-8">
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="flex items-center gap-2.5 text-3xl font-extrabold tracking-tight"><Bookmark size={28} class="text-accent" /> Bộ sưu tập</h1>
      <p class="mt-1 max-w-[60ch] text-muted">Gom các đề cùng chủ đề vào một chỗ: ôn theo chương, theo kỳ thi, hoặc chia sẻ cả bộ cho bạn bè.</p>
    </div>
    {#if data.signedIn && data.available}
      <button class="btn btn-primary" onclick={() => { showForm = !showForm; }} aria-expanded={showForm}><Plus size={16} /> Bộ sưu tập mới</button>
    {/if}
  </div>

  {#if !data.available}
    <EmptyState icon={DatabaseZap} title="Bộ sưu tập chưa được bật"
      description="Database chưa có bảng bộ sưu tập. Chủ trang cần chạy migration 009 trong Supabase SQL Editor." />
  {:else}
    {#if showForm}
      <form class="card rise-in grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-end" onsubmit={create}>
        <div class="space-y-3">
          <div>
            <label class="label" for="c-title">Tên bộ sưu tập</label>
            <input id="c-title" class="input" maxlength="120" required placeholder="Ví dụ: Sinh học 12, chương Di truyền" bind:value={title} />
          </div>
          <div>
            <label class="label" for="c-desc">Mô tả <span class="font-normal text-faint">(không bắt buộc)</span></label>
            <textarea id="c-desc" class="input min-h-20" maxlength="500" placeholder="Bộ sưu tập này dùng để làm gì?" bind:value={description}></textarea>
          </div>
          <label class="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" bind:checked={isPublic} class="h-4 w-4 accent-[var(--accent)]" /> Công khai, ai có liên kết hoặc xem trang cá nhân của bạn đều thấy
          </label>
        </div>
        <div class="flex gap-2">
          <button type="button" class="btn btn-ghost" onclick={() => { showForm = false; }}>Huỷ</button>
          <button class="btn btn-primary" disabled={!title.trim() || saving}>{saving ? 'Đang tạo...' : 'Tạo bộ sưu tập'}</button>
        </div>
      </form>
    {/if}

    <section aria-labelledby="mine-title">
      <h2 id="mine-title" class="mb-3 text-lg font-bold">Của tôi</h2>
      {#if !data.signedIn}
        <EmptyState icon={LogIn} title="Đăng nhập để tạo bộ sưu tập" description="Lưu đề yêu thích vào các danh sách riêng và ôn lại bất cứ lúc nào.">
          <a href="/auth?next=/bo-suu-tap" class="btn btn-primary"><LogIn size={16} /> Đăng nhập</a>
        </EmptyState>
      {:else if data.mine.length === 0}
        <EmptyState icon={Bookmark} title="Chưa có bộ sưu tập nào"
          description="Bấm Bộ sưu tập mới, hoặc mở một đề bất kỳ rồi chọn Lưu vào bộ sưu tập.">
          <button class="btn btn-primary" onclick={() => { showForm = true; }}><Plus size={16} /> Tạo bộ sưu tập đầu tiên</button>
        </EmptyState>
      {:else}
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {#each data.mine as c (c.id)}<CollectionCard collection={{ ...c, owner: null }} showVisibility />{/each}
        </div>
      {/if}
    </section>

    {#if data.community.length > 0}
      <section aria-labelledby="community-title">
        <div class="mb-3 flex items-center justify-between">
          <h2 id="community-title" class="text-lg font-bold">Từ cộng đồng</h2>
          <a href="/kham-pha" class="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"><Compass size={15} /> Khám phá đề</a>
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {#each data.community as c (c.id)}<CollectionCard collection={c} />{/each}
        </div>
      </section>
    {/if}
  {/if}
</div>
