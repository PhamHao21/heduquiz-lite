<!-- src/lib/components/StatsCard.svelte -->
<script lang="ts">
  import { BookOpen, Trophy, Flame, Target } from 'lucide-svelte';
  import { authStore } from '$lib/stores/auth.svelte';

  interface Props {
    totalQuizzes?: number;
    totalAttempts?: number;
    streak?: number;
    accuracy?: number;
  }

  const {
    totalQuizzes = 0,
    totalAttempts = 0,
    streak = 0,
    accuracy = 0
  }: Props = $props();

  const stats = $derived([
    { label: 'Đề đã tạo',   value: totalQuizzes,  icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Lượt thi',    value: totalAttempts,  icon: Target,   color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Chuỗi ngày',  value: streak,         icon: Flame,    color: 'text-pink-500',   bg: 'bg-pink-50'   },
    { label: 'Độ chính xác',value: `${accuracy}%`, icon: Trophy,   color: 'text-emerald-500',bg: 'bg-emerald-50'},
  ]);
</script>

<div class="rounded-[2.5rem] bg-white border border-slate-100 shadow-sm p-6">
  <div class="mb-4 flex items-center justify-between">
    <h2 class="text-sm font-black uppercase tracking-widest text-slate-400">Thống kê của bạn</h2>
    {#if authStore.isAuthed}
      <span class="text-xs font-bold text-indigo-500">{authStore.user?.user_metadata?.full_name ?? authStore.user?.email}</span>
    {/if}
  </div>

  <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
    {#each stats as s (s.label)}
      <div class="flex flex-col items-center gap-2 rounded-2xl {s.bg} p-4">
        <svelte:component this={s.icon} size={20} class={s.color} />
        <span class="text-2xl font-black text-slate-800">{s.value}</span>
        <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">{s.label}</span>
      </div>
    {/each}
  </div>
</div>
