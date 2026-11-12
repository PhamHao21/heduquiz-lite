<!-- src/routes/bo-suu-tap/[id]/+page.svelte -->
<script lang="ts">
  import { Bookmark, Globe, Lock, Pencil, Trash2, Link2, X, Layers, ListChecks, Shuffle, Compass } from 'lucide-svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import QuizTile from '$lib/components/quiz/QuizTile.svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
  import { coverStyle } from '$lib/utils/cover';
  import { timeAgo } from '$lib/utils/time';
  import { deleteCollection, setInCollection, updateCollection } from '$lib/supabase/collections';
  import { toast } from '$lib/stores/toast.svelte';

  const { data } = $props();
  const c = $derived(data.collection);
  const liked = $derived(new Set(data.liked));
  const ownerName = $derived(c.owner?.display_name || c.owner?.username || 'Ẩn danh');

  let editing = $state(false);
  let title = $state('');
  let description = $state('');
  let isPublic = $state(false);
  let saving = $state(false);
  let confirmDelete = $state(false);
  let deleting = $state(false);
  let removing = $state<string | null>(null);

  function startEdit() {
    title = c.title;
    description = c.description ?? '';
    isPublic = c.is_public;
    editing = true;
  }

  async function save(e: SubmitEvent) {
    e.preventDefault();
    if (!title.trim() || saving) return;
    saving = true;
    try {
      await updateCollection(c.id, { title: title.trim(), description: description.trim() || null, is_public: isPublic });
      await invalidateAll();
      editing = false;
      toast.success('Đã lưu thay đổi');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không lưu được');
    } finally {
      saving = false;
    }
  }

  async function remove() {
    deleting = true;
    try {
      await deleteCollection(c.id);
      toast.success('Đã xoá bộ sưu tập');
      await goto('/bo-suu-tap');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không xoá được');
      deleting = false;
      confirmDelete = false;
    }
  }

  async function removeQuiz(id: string, quizTitle: string) {
    removing = id;
    try {
      await setInCollection(c.id, id, false);
      await invalidateAll();
      toast.success(`Đã bỏ "${quizTitle}" khỏi bộ sưu tập`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không bỏ được đề');
    } finally {
      removing = null;
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(page.url.href);
      toast.success('Đã sao chép liên kết');
    } catch {
      toast.error('Trình duyệt không cho sao chép, hãy copy địa chỉ trên thanh URL');
    }
  }

  function randomQuiz() {
    if (data.quizzes.length === 0) return;
    const q = data.quizzes[Math.floor(Math.random() * data.quizzes.length)];
    goto(`/quiz/${q.id}`);
  }
</script>

<svelte:head>
  <title>{c.title} · Bộ sưu tập · HeduQuiz</title>
  <meta name="description" content={c.description ?? `Bộ sưu tập ${data.quizzes.length} đề trắc nghiệm của ${ownerName} trên HeduQuiz.`} />
  <meta property="og:title" content="{c.title} · HeduQuiz" />
</svelte:head>

<div class="space-y-6">
  <section class="card rise-in overflow-hidden">
    <div class="h-28 sm:h-36" style={coverStyle(c.id)} aria-hidden="true"></div>
    <div class="px-5 pb-6 sm:px-8">
      <div class="relative flex flex-wrap items-start gap-4 pt-4">
        <span class="-mt-12 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface text-accent shadow-sm ring-4 ring-surface"><Bookmark size={28} /></span>
        <div class="ml-auto flex flex-wrap gap-2">
          {#if data.quizzes.length > 1}
            <button class="btn btn-secondary btn-sm" onclick={randomQuiz}><Shuffle size={15} /> Đề ngẫu nhiên</button>
          {/if}
          {#if c.is_public}
            <button class="btn btn-secondary btn-sm" onclick={copyLink}><Link2 size={15} /> Sao chép liên kết</button>
          {/if}
          {#if data.isOwner}
            <button class="btn btn-secondary btn-sm" onclick={startEdit}><Pencil size={15} /> Sửa</button>
            <button class="btn btn-ghost btn-sm text-danger hover:bg-danger-soft hover:text-danger" onclick={() => { confirmDelete = true; }}><Trash2 size={15} /> Xoá</button>
          {/if}
        </div>
      </div>

      {#if editing}
        <form class="mt-5 max-w-2xl space-y-3" onsubmit={save}>
          <div>
            <label class="label" for="e-title">Tên bộ sưu tập</label>
            <input id="e-title" class="input" maxlength="120" required bind:value={title} />
          </div>
          <div>
            <label class="label" for="e-desc">Mô tả</label>
            <textarea id="e-desc" class="input min-h-20" maxlength="500" bind:value={description}></textarea>
          </div>
          <label class="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" bind:checked={isPublic} class="h-4 w-4 accent-[var(--accent)]" /> Công khai
          </label>
          <div class="flex gap-2">
            <button class="btn btn-primary" disabled={!title.trim() || saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            <button type="button" class="btn btn-ghost" onclick={() => { editing = false; }}>Huỷ</button>
          </div>
        </form>
      {:else}
        <p class="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
          {#if c.is_public}<Globe size={13} /> Bộ sưu tập công khai{:else}<Lock size={13} /> Bộ sưu tập riêng tư{/if}
        </p>
        <h1 class="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{c.title}</h1>
        {#if c.description}<p class="mt-2 max-w-[62ch] whitespace-pre-line leading-relaxed text-muted">{c.description}</p>{/if}
        <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {#if c.owner}
            <a href="/u/{c.owner.username}" class="inline-flex items-center gap-2 font-semibold hover:underline">
              <Avatar name={ownerName} src={c.owner.avatar_url} size={24} /> {ownerName}
            </a>
          {/if}
          <span class="inline-flex items-center gap-1.5 text-muted"><Layers size={15} /> {data.quizzes.length} đề</span>
          <span class="inline-flex items-center gap-1.5 text-muted"><ListChecks size={15} /> {data.totalQuestions} câu hỏi</span>
          <span class="text-muted">Cập nhật {timeAgo(c.updated_at)}</span>
        </div>
      {/if}
    </div>
  </section>

  {#if data.isOwner && data.hidden > 0}
    <p class="rounded-xl bg-warning-soft px-4 py-3 text-sm text-ink">
      {data.hidden} đề trong bộ sưu tập đã được tác giả chuyển sang riêng tư hoặc bị xoá nên không hiển thị.
    </p>
  {/if}

  {#if data.quizzes.length === 0}
    <EmptyState icon={Bookmark} title="Bộ sưu tập này chưa có đề nào"
      description={data.isOwner ? 'Mở một đề bất kỳ rồi bấm Lưu vào bộ sưu tập để thêm vào đây.' : undefined}>
      {#if data.isOwner}<a href="/kham-pha" class="btn btn-primary"><Compass size={16} /> Tìm đề trong Khám phá</a>{/if}
    </EmptyState>
  {:else}
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {#each data.quizzes as quiz (quiz.id)}
        <div class="relative">
          <QuizTile {quiz} liked={liked.has(quiz.id)} />
          {#if data.isOwner}
            <button class="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-muted shadow-sm backdrop-blur transition hover:text-danger disabled:opacity-50"
              aria-label="Bỏ {quiz.title} khỏi bộ sưu tập" title="Bỏ khỏi bộ sưu tập"
              disabled={removing === quiz.id} onclick={() => removeQuiz(quiz.id, quiz.title)}>
              <X size={15} />
            </button>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<ConfirmModal open={confirmDelete} danger loading={deleting}
  title="Xoá bộ sưu tập này?"
  message="Chỉ xoá danh sách, các đề bên trong vẫn còn nguyên. Không thể hoàn tác."
  confirmLabel="Xoá bộ sưu tập"
  onConfirm={remove} onCancel={() => { confirmDelete = false; }} />
