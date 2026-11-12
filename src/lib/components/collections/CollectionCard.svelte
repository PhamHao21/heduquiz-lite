<!-- src/lib/components/collections/CollectionCard.svelte -->
<!-- Thẻ bộ sưu tập: ảnh bìa ghép từ 4 đề đầu tiên, tên, số đề, chủ sở hữu. -->
<script lang="ts">
  import { Lock, Globe, Layers, Bookmark } from 'lucide-svelte';
  import { coverStyle } from '$lib/utils/cover';
  import Avatar from '$lib/components/ui/Avatar.svelte';

  interface CollectionLike {
    id: string; title: string; description?: string | null; is_public?: boolean; count: number; quizIds: string[];
    owner?: { username: string; display_name: string | null; avatar_url: string | null } | null;
  }
  interface Props { collection: CollectionLike; showVisibility?: boolean }
  const { collection, showVisibility = false }: Props = $props();
  const c = $derived(collection);
  const tiles = $derived([0, 1, 2, 3].map(i => c.quizIds[i] ?? `${c.id}:${i}`));
</script>

<article class="card card-hover group relative flex flex-col overflow-hidden">
  {#if c.quizIds.length === 0}
    <div class="flex h-28 items-center justify-center text-white/90" style={coverStyle(c.id)} aria-hidden="true"><Bookmark size={26} /></div>
  {:else}
    <div class="grid h-28 grid-cols-2 grid-rows-2 gap-0.5 bg-surface" aria-hidden="true">
      {#each tiles as t, i (i)}
        <div style={coverStyle(t)} class={c.quizIds[i] ? '' : 'opacity-40'}></div>
      {/each}
    </div>
  {/if}
  <div class="flex flex-1 flex-col p-4">
    <h3 class="line-clamp-2 text-[15px] font-bold leading-snug group-hover:text-accent">
      <a href="/bo-suu-tap/{c.id}" class="after:absolute after:inset-0 after:content-['']">{c.title}</a>
    </h3>
    {#if c.description}<p class="mt-1 line-clamp-2 text-xs text-muted">{c.description}</p>{/if}
    <p class="mt-auto flex items-center gap-3 pt-3 text-xs font-medium text-muted">
      <span class="inline-flex items-center gap-1"><Layers size={13} /> {c.count} đề</span>
      {#if showVisibility}
        <span class="inline-flex items-center gap-1">{#if c.is_public}<Globe size={12} /> Công khai{:else}<Lock size={12} /> Riêng tư{/if}</span>
      {/if}
      {#if c.owner}
        <span class="ml-auto inline-flex min-w-0 items-center gap-1.5">
          <Avatar name={c.owner.display_name ?? c.owner.username} src={c.owner.avatar_url} size={18} />
          <span class="truncate">{c.owner.display_name ?? c.owner.username}</span>
        </span>
      {/if}
    </p>
  </div>
</article>
