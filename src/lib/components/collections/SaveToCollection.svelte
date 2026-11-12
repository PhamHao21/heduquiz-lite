<!-- src/lib/components/collections/SaveToCollection.svelte -->
<!-- Nút "Lưu vào bộ sưu tập": chọn bộ sưu tập (đánh dấu / bỏ), hoặc tạo bộ sưu tập mới ngay tại chỗ. -->
<script lang="ts">
  import { Bookmark, Check, Plus, X, Lock, Globe } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { toast } from '$lib/stores/toast.svelte';
  import { createCollection, myCollectionsFor, setInCollection, type MyCollection } from '$lib/supabase/collections';

  const { quizId }: { quizId: string } = $props();

  let open = $state(false);
  let loading = $state(false);
  let items = $state<MyCollection[]>([]);
  let newTitle = $state('');
  let newPublic = $state(false);
  let creating = $state(false);
  const savedCount = $derived(items.filter(i => i.has).length);

  async function openSheet() {
    const me = page.data.profile;
    if (!me) { goto(`/auth?next=${encodeURIComponent(page.url.pathname)}`); return; }
    open = true;
    loading = true;
    try {
      items = await myCollectionsFor(me.id, quizId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được bộ sưu tập');
      open = false;
    } finally {
      loading = false;
    }
  }

  async function toggle(c: MyCollection) {
    const next = !c.has;
    items = items.map(i => (i.id === c.id ? { ...i, has: next, count: i.count + (next ? 1 : -1) } : i));
    try {
      await setInCollection(c.id, quizId, next);
      toast.success(next ? `Đã lưu vào "${c.title}"` : `Đã bỏ khỏi "${c.title}"`);
    } catch (err) {
      items = items.map(i => (i.id === c.id ? { ...i, has: !next, count: i.count + (next ? -1 : 1) } : i));
      toast.error(err instanceof Error ? err.message : 'Không thực hiện được');
    }
  }

  async function create(e: SubmitEvent) {
    e.preventDefault();
    const me = page.data.profile;
    if (!me || !newTitle.trim() || creating) return;
    creating = true;
    try {
      const id = await createCollection(me.id, newTitle, newPublic);
      await setInCollection(id, quizId, true);
      items = [{ id, title: newTitle.trim(), is_public: newPublic, has: true, count: 1 }, ...items];
      toast.success(`Đã tạo "${newTitle.trim()}" và lưu đề vào`);
      newTitle = '';
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tạo được bộ sưu tập');
    } finally {
      creating = false;
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (open && e.key === 'Escape') open = false;
  }
</script>

<svelte:window onkeydown={onKeydown} />

<button onclick={openSheet} class="btn btn-ghost btn-sm"><Bookmark size={15} /> Lưu vào bộ sưu tập</button>

{#if open}
  <div class="fixed inset-0 z-[150] flex items-end justify-center sm:items-center sm:p-4">
    <button class="absolute inset-0 bg-black/45 backdrop-blur-[2px]" aria-label="Đóng" tabindex="-1" onclick={() => { open = false; }}></button>
    <div class="card rise-in relative w-full max-w-md rounded-b-none p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-2xl sm:pb-5"
      role="dialog" aria-modal="true" aria-labelledby="save-title">
      <div class="mb-4 flex items-center justify-between">
        <h2 id="save-title" class="text-lg font-bold">Lưu vào bộ sưu tập</h2>
        <button class="btn btn-ghost btn-icon" onclick={() => { open = false; }} aria-label="Đóng"><X size={18} /></button>
      </div>

      {#if loading}
        <div class="space-y-2"><div class="skeleton h-12"></div><div class="skeleton h-12"></div></div>
      {:else}
        <ul class="max-h-64 space-y-1.5 overflow-y-auto">
          {#each items as c (c.id)}
            <li>
              <button onclick={() => toggle(c)} aria-pressed={c.has}
                class="flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition {c.has ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong'}">
                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border {c.has ? 'border-accent bg-accent text-on-accent' : 'border-line-strong'}">
                  {#if c.has}<Check size={13} strokeWidth={3} />{/if}
                </span>
                <span class="min-w-0 flex-1 truncate text-sm font-semibold">{c.title}</span>
                <span class="inline-flex shrink-0 items-center gap-1 text-xs text-muted">
                  {#if c.is_public}<Globe size={12} />{:else}<Lock size={12} />{/if} {c.count} đề
                </span>
              </button>
            </li>
          {:else}
            <li class="rounded-xl bg-sunken px-4 py-3 text-sm text-muted">Bạn chưa có bộ sưu tập nào. Tạo cái đầu tiên bên dưới.</li>
          {/each}
        </ul>
        <form class="mt-4 space-y-2 border-t border-line pt-4" onsubmit={create}>
          <label class="label" for="new-collection">Bộ sưu tập mới</label>
          <div class="flex gap-2">
            <input id="new-collection" class="input" maxlength="120" placeholder="Ví dụ: Ôn thi THPT môn Sinh" bind:value={newTitle} />
            <button class="btn btn-primary shrink-0" disabled={!newTitle.trim() || creating}><Plus size={16} /> Tạo</button>
          </div>
          <label class="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" bind:checked={newPublic} class="h-4 w-4 accent-[var(--accent)]" /> Công khai (ai cũng xem được)
          </label>
        </form>
        {#if savedCount > 0}<p class="mt-3 text-xs text-muted">Đề này đang nằm trong {savedCount} bộ sưu tập của bạn.</p>{/if}
      {/if}
    </div>
  </div>
{/if}
