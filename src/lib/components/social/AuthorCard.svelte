<!-- src/lib/components/social/AuthorCard.svelte -->
<script lang="ts">
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import FollowButton from './FollowButton.svelte';
  import { coverStyle } from '$lib/utils/cover';
  import { compactNumber } from '$lib/utils/time';

  interface Props {
    author: {
      id: string; username: string; display_name: string; avatar_url: string | null; bio?: string | null;
      follower_count: number; public_quizzes?: number;
    };
    following?: boolean;
  }
  const { author, following = false }: Props = $props();
  let followers = $derived(author.follower_count);
</script>

<article class="card relative flex flex-col overflow-hidden">
  <div class="h-14" style={coverStyle(author.username)} aria-hidden="true"></div>
  <div class="-mt-7 flex flex-1 flex-col px-4 pb-4">
    <span class="rounded-full ring-4 ring-surface self-start"><Avatar name={author.display_name} src={author.avatar_url} size={52} /></span>
    <a href="/u/{author.username}" class="mt-2 truncate font-bold hover:underline">{author.display_name}</a>
    <p class="truncate text-xs text-muted">@{author.username}</p>
    {#if author.bio}<p class="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">{author.bio}</p>{/if}
    <p class="mt-3 text-xs text-muted">
      <b class="text-ink">{compactNumber(followers)}</b> người theo dõi{#if author.public_quizzes != null}<span>, </span><b class="text-ink">{author.public_quizzes}</b> đề{/if}
    </p>
    <div class="mt-4">
      <FollowButton userId={author.id} {following} size="sm" onchange={(f) => { followers = Math.max(0, followers + (f ? 1 : -1)); }} />
    </div>
  </div>
</article>
