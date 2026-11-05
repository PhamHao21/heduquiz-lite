<!-- src/lib/components/social/CommentSection.svelte -->
<script lang="ts">
  import { MessageCircle, Trash2, Send } from 'lucide-svelte';
  import { page } from '$app/state';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import { addComment, deleteComment, type CommentItem } from '$lib/supabase/social';
  import { toast } from '$lib/stores/toast.svelte';
  import { timeAgo } from '$lib/utils/time';

  interface Props { quizId: string; quizOwnerId: string; comments: CommentItem[] }
  const props: Props = $props();

  let items = $derived<CommentItem[]>([...props.comments]);

  let text = $state('');
  let sending = $state(false);
  const me = $derived(page.data.profile);
  const MAX = 1000;

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!me || !text.trim() || sending) return;
    sending = true;
    try {
      const row = await addComment(me.id, props.quizId, text);
      items = [{ ...row, author: { username: me.username, display_name: me.display_name, avatar_url: me.avatar_url } }, ...items];
      text = '';
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không gửi được bình luận');
    } finally {
      sending = false;
    }
  }

  async function remove(c: CommentItem) {
    if (!confirm('Xoá bình luận này?')) return;
    const before = items;
    items = items.filter(i => i.id !== c.id);
    try {
      await deleteComment(c.id);
    } catch (err) {
      items = before;
      toast.error(err instanceof Error ? err.message : 'Không xoá được bình luận');
    }
  }
</script>

<section id="binh-luan" class="card scroll-mt-24 p-6">
  <h2 class="flex items-center gap-2 font-bold"><MessageCircle size={18} class="text-accent" /> Bình luận <span class="text-faint">{items.length}</span></h2>

  {#if me}
    <form class="mt-4 flex gap-3" onsubmit={submit}>
      <Avatar name={me.display_name ?? me.username} src={me.avatar_url} size={36} />
      <div class="min-w-0 flex-1">
        <label class="sr-only" for="comment-box">Viết bình luận</label>
        <textarea id="comment-box" bind:value={text} maxlength={MAX} rows="2" placeholder="Chia sẻ cảm nhận, góp ý hoặc hỏi về đề này"
          class="input resize-y"
          onkeydown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) (e.currentTarget.form as HTMLFormElement).requestSubmit(); }}></textarea>
        <div class="mt-2 flex items-center justify-between">
          <span class="text-xs text-faint">{text.length}/{MAX} · Ctrl + Enter để gửi</span>
          <button class="btn btn-primary btn-sm" disabled={!text.trim() || sending}><Send size={14} /> {sending ? 'Đang gửi…' : 'Gửi'}</button>
        </div>
      </div>
    </form>
  {:else}
    <p class="mt-4 rounded-xl bg-sunken px-4 py-3 text-sm text-muted">
      <a href="/auth?next={encodeURIComponent(page.url.pathname)}" class="font-semibold text-accent hover:underline">Đăng nhập</a> để bình luận.
    </p>
  {/if}

  {#if items.length === 0}
    <p class="mt-5 text-sm text-muted">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
  {:else}
    <ul class="mt-5 space-y-4">
      {#each items as c (c.id)}
        <li class="flex gap-3">
          <a href="/u/{c.author?.username}" class="shrink-0"><Avatar name={c.author?.display_name ?? c.author?.username} src={c.author?.avatar_url} size={36} /></a>
          <div class="min-w-0 flex-1">
            <div class="rounded-2xl rounded-tl-md bg-sunken px-4 py-2.5">
              <a href="/u/{c.author?.username}" class="text-sm font-bold hover:underline">{c.author?.display_name ?? c.author?.username ?? 'Người dùng'}</a>
              {#if c.user_id === props.quizOwnerId}<span class="tag ml-1.5 bg-accent-soft text-accent-ink">Tác giả</span>{/if}
              <p class="mt-0.5 whitespace-pre-line break-words text-sm leading-relaxed">{c.content}</p>
            </div>
            <div class="mt-1 flex items-center gap-3 pl-2 text-xs text-faint">
              <span>{timeAgo(c.created_at)}</span>
              {#if me && (me.id === c.user_id || me.id === props.quizOwnerId)}
                <button onclick={() => remove(c)} class="inline-flex items-center gap-1 hover:text-danger"><Trash2 size={12} /> Xoá</button>
              {/if}
            </div>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>
