<!-- src/lib/components/channel/ChannelHeader.svelte -->
<script lang="ts">
  interface Props {
    profile: { display_name: string | null; username: string };
    quizCount: number;
    isOwner: boolean;
    onEditBio: () => void;
  }

  const { profile, quizCount, isOwner, onEditBio }: Props = $props();
</script>

<div class="mb-8">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">
        {profile.display_name ?? profile.username}
      </h1>
      <p class="text-sm text-slate-500">@{profile.username} • {quizCount} đề thi</p>
    </div>
    {#if isOwner}
      <button
        onclick={onEditBio}
        class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
      >
        ✏️ Chỉnh sửa
      </button>
    {/if}
  </div>
</div>
