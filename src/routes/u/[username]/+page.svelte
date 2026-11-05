<!-- src/routes/u/[username]/+page.svelte -->
<script lang="ts">
  import { FileText, Pencil, Plus, CalendarDays, Users } from 'lucide-svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import QuizTile from '$lib/components/quiz/QuizTile.svelte';
  import FollowButton from '$lib/components/social/FollowButton.svelte';
  import { coverStyle } from '$lib/utils/cover';
  import { compactNumber } from '$lib/utils/time';

  const { data } = $props();
  const p = $derived(data.person);
  const name = $derived(p.display_name || p.username);
  const joined = $derived(new Date(p.created_at).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }));
  const liked = $derived(new Set(data.liked));
  const peopleFollowed = $derived(new Set(data.peopleFollowed));

  let followers = $derived(p.follower_count ?? 0);

  const tabs = $derived([
    { key: 'de', label: 'Đề công khai', count: data.quizzes.length },
    { key: 'nguoi-theo-doi', label: 'Người theo dõi', count: followers },
    { key: 'dang-theo-doi', label: 'Đang theo dõi', count: p.following_count ?? 0 }
  ]);
  const tabHref = (key: string) => (key === 'de' ? `/u/${p.username}` : `/u/${p.username}?tab=${key}`);
</script>

<svelte:head>
  <title>{name} (@{p.username}) · HeduQuiz</title>
  <meta name="description" content="Các đề trắc nghiệm công khai của {name} trên HeduQuiz." />
  <meta property="og:title" content="{name} trên HeduQuiz" />
  <meta property="og:description" content="{data.quizzes.length} đề công khai, {followers} người theo dõi." />
</svelte:head>

<div class="space-y-6">
  <section class="card rise-in overflow-hidden">
    <div class="h-32 sm:h-44" style={coverStyle(p.username)} aria-hidden="true"></div>
    <div class="px-5 pb-6 sm:px-8">
      <div class="-mt-12 flex flex-wrap items-end gap-4 sm:-mt-14">
        <span class="rounded-full ring-4 ring-surface"><Avatar name={name} src={p.avatar_url} size={104} /></span>
        <div class="ml-auto flex gap-2 pb-1">
          {#if data.isMe}
            <a href="/thiet-lap" class="btn btn-secondary"><Pencil size={15} /> Sửa hồ sơ</a>
          {:else}
            <FollowButton userId={p.id} following={data.isFollowing} onchange={(f) => { followers = Math.max(0, followers + (f ? 1 : -1)); }} />
          {/if}
        </div>
      </div>
      <h1 class="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">{name}</h1>
      <p class="text-sm text-muted">@{p.username}</p>
      {#if p.bio}<p class="mt-3 max-w-[62ch] whitespace-pre-line leading-relaxed">{p.bio}</p>{/if}

      <dl class="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <div class="flex gap-1.5"><dt class="sr-only">Người theo dõi</dt><dd><b>{compactNumber(followers)}</b> <span class="text-muted">người theo dõi</span></dd></div>
        <div class="flex gap-1.5"><dt class="sr-only">Đang theo dõi</dt><dd><b>{compactNumber(p.following_count ?? 0)}</b> <span class="text-muted">đang theo dõi</span></dd></div>
        <div class="flex gap-1.5"><dt class="sr-only">Tim nhận được</dt><dd><b>{compactNumber(data.totalLikes)}</b> <span class="text-muted">lượt tim</span></dd></div>
        <div class="flex gap-1.5"><dt class="sr-only">Lượt ôn</dt><dd><b>{compactNumber(data.totalPlays)}</b> <span class="text-muted">lượt ôn</span></dd></div>
        <div class="flex items-center gap-1.5 text-muted"><CalendarDays size={15} /> Tham gia {joined}</div>
      </dl>
    </div>
  </section>

  <nav class="segmented" aria-label="Nội dung trang cá nhân">
    {#each tabs as t (t.key)}
      <a href={tabHref(t.key)} aria-current={data.tab === t.key ? 'true' : undefined} data-sveltekit-noscroll>
        {t.label} <span class="text-faint">{t.count}</span>
      </a>
    {/each}
  </nav>

  {#if data.tab === 'de'}
    {#if data.quizzes.length === 0}
      <EmptyState icon={FileText} title={data.isMe ? 'Bạn chưa có đề công khai nào' : `${name} chưa chia sẻ đề nào`}
        description={data.isMe ? 'Đề ở chế độ công khai sẽ hiện ở đây và trong trang Khám phá.' : undefined}>
        {#if data.isMe}<a href="/kho-de" class="btn btn-primary"><Plus size={16} /> Mở Kho đề</a>{/if}
      </EmptyState>
    {:else}
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {#each data.quizzes as quiz (quiz.id)}
          <QuizTile {quiz} liked={liked.has(quiz.id)} showOwner={false} />
        {/each}
      </div>
    {/if}
  {:else if data.people.length === 0}
    <EmptyState icon={Users} title={data.tab === 'nguoi-theo-doi' ? 'Chưa có người theo dõi' : 'Chưa theo dõi ai'} />
  {:else}
    <ul class="card divide-y divide-line overflow-hidden">
      {#each data.people as person (person.id)}
        <li class="flex items-center gap-3 px-5 py-3.5">
          <a href="/u/{person.username}"><Avatar name={person.display_name ?? person.username} src={person.avatar_url} size={42} /></a>
          <a href="/u/{person.username}" class="min-w-0 flex-1">
            <span class="block truncate font-semibold hover:underline">{person.display_name ?? person.username}</span>
            <span class="block truncate text-xs text-muted">@{person.username}{person.bio ? `, ${person.bio}` : ''}</span>
          </a>
          <FollowButton userId={person.id} following={peopleFollowed.has(person.id)} size="sm" />
        </li>
      {/each}
    </ul>
  {/if}
</div>
