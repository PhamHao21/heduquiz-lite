<!-- src/routes/thong-ke/+page.svelte -->
<script lang="ts">
  import {
    BarChart3, TrendingUp, TrendingDown, Minus, Rocket, Target, Flame, Star, PenLine, Heart, Users, Compass,
    Sunrise, Moon, Trophy, Settings2, Play
  } from 'lucide-svelte';
  import ColumnChart from '$lib/components/charts/ColumnChart.svelte';
  import LineChart from '$lib/components/charts/LineChart.svelte';
  import GoalRing from '$lib/components/charts/GoalRing.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import { formatDuration } from '$lib/utils/stats';
  import { TIER_NAMES, type AchievementIcon } from '$lib/utils/achievements';
  import { shortDate } from '$lib/components/charts/scale';

  const { data } = $props();
  const s = $derived(data.stats);

  const ICONS: Record<AchievementIcon, typeof Rocket> = {
    rocket: Rocket, target: Target, flame: Flame, star: Star, pen: PenLine, heart: Heart,
    users: Users, compass: Compass, sunrise: Sunrise, moon: Moon
  };
  const TIER_TONE = ['bg-sunken text-faint', 'bg-[#b4682e]/15 text-[#b4682e]', 'bg-[#8a94a3]/20 text-muted', 'bg-[#c99a06]/15 text-[#a37c00] dark:text-[#e2b93b]', 'bg-accent-soft text-accent'];

  const pct = (v: number | null) => (v === null ? '-' : `${Math.round(v * 100)}%`);
  const unlocked = $derived(data.achievements.filter(a => a.level > 0).length);

  /** So sánh với kỳ trước: số dương là tăng. */
  const deltas = $derived({
    questions: s.totals.questions - s.previous.questions,
    accuracy: s.totals.accuracy !== null && s.previous.accuracy !== null
      ? Math.round((s.totals.accuracy - s.previous.accuracy) * 100) : null,
    time: s.totals.seconds - s.previous.seconds
  });

  const columnData = $derived(s.series.map(d => ({ date: d.date, value: d.questions, note: d.attempts ? `${d.attempts} lượt` : undefined })));
  const lineData = $derived(s.series.map(d => ({ date: d.date, value: d.accuracy, note: d.questions ? `${d.correct}/${d.questions} câu` : undefined })));
</script>

<svelte:head><title>Thống kê học tập · HeduQuiz</title></svelte:head>

{#snippet delta(value: number | null, unit: string)}
  {#if value === null || value === 0}
    <span class="inline-flex items-center gap-1 text-xs font-medium text-faint"><Minus size={12} /> như kỳ trước</span>
  {:else}
    <span class="inline-flex items-center gap-1 text-xs font-semibold {value > 0 ? 'text-success' : 'text-danger'}">
      {#if value > 0}<TrendingUp size={13} />{:else}<TrendingDown size={13} />{/if}
      {value > 0 ? '+' : ''}{value.toLocaleString('vi-VN')}{unit} so với kỳ trước
    </span>
  {/if}
{/snippet}

<div class="space-y-6">
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 class="flex items-center gap-2.5 text-3xl font-extrabold tracking-tight"><BarChart3 size={28} class="text-accent" /> Thống kê học tập</h1>
      <p class="mt-1.5 text-muted">Tiến độ của bạn trong {data.days} ngày gần nhất.</p>
    </div>
    <nav class="segmented" aria-label="Khoảng thời gian">
      {#each data.periods as p (p)}
        <a href="/thong-ke?ky={p}" aria-current={data.days === p ? 'true' : undefined} data-sveltekit-noscroll>{p} ngày</a>
      {/each}
    </nav>
  </div>

  {#if !data.hasAny}
    <EmptyState icon={BarChart3} title="Chưa có dữ liệu" description="Ôn thử một đề khi đã đăng nhập, thống kê và thành tích sẽ hiện ở đây.">
      <a href="/kham-pha" class="btn btn-primary"><Play size={16} /> Ôn một đề</a>
    </EmptyState>
  {:else}
    <!-- Ô số liệu + mục tiêu hôm nay -->
    <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.15fr)]">
      <div class="card p-5">
        <p class="text-sm font-medium text-muted">Câu đã làm</p>
        <p class="mt-1 text-3xl font-extrabold">{s.totals.questions.toLocaleString('vi-VN')}</p>
        <p class="mt-1">{@render delta(deltas.questions, '')}</p>
      </div>
      <div class="card p-5">
        <p class="text-sm font-medium text-muted">Độ chính xác</p>
        <p class="mt-1 text-3xl font-extrabold">{pct(s.totals.accuracy)}</p>
        <p class="mt-1">{@render delta(deltas.accuracy, ' điểm %')}</p>
      </div>
      <div class="card p-5">
        <p class="text-sm font-medium text-muted">Thời gian ôn</p>
        <p class="mt-1 text-3xl font-extrabold">{formatDuration(s.totals.seconds)}</p>
        <p class="mt-1 text-xs text-muted">{s.totals.attempts} lượt làm bài</p>
      </div>
      <div class="card flex items-center gap-4 p-5">
        <GoalRing value={s.todayQuestions} goal={data.goal} />
        <div class="min-w-0">
          <p class="text-sm font-medium text-muted">Mục tiêu hôm nay</p>
          <p class="mt-1 font-bold">{s.todayQuestions >= data.goal ? 'Đã hoàn thành!' : `Còn ${data.goal - s.todayQuestions} câu`}</p>
          <p class="mt-1 inline-flex items-center gap-1 text-xs text-muted"><Flame size={13} class="text-[#f26a1b]" /> Chuỗi {data.streak} ngày, dài nhất {data.bestStreak}</p>
          <a href="/thiet-lap#muc-tieu" class="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"><Settings2 size={12} /> Đổi mục tiêu</a>
        </div>
      </div>
    </section>

    <!-- Biểu đồ -->
    <section class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <div class="card p-5">
        <h2 class="font-bold">Số câu đã làm mỗi ngày</h2>
        <p class="text-xs text-muted">Đường gạch là mục tiêu {data.goal} câu / ngày</p>
        <div class="mt-4">
          <ColumnChart data={columnData} unit="câu" label="Biểu đồ cột số câu đã làm mỗi ngày trong {data.days} ngày"
            reference={{ value: data.goal, label: `Mục tiêu ${data.goal}` }} />
        </div>
        <details class="mt-3 text-sm">
          <summary class="cursor-pointer text-xs font-semibold text-muted hover:text-ink">Xem bảng số liệu</summary>
          <div class="mt-2 max-h-56 overflow-y-auto">
            <table class="w-full text-left text-xs tabular-nums">
              <thead class="text-muted"><tr><th class="py-1 font-semibold">Ngày</th><th class="font-semibold">Câu</th><th class="font-semibold">Lượt</th><th class="font-semibold">Đúng</th></tr></thead>
              <tbody>
                {#each [...s.series].reverse().filter(d => d.questions) as d (d.date)}
                  <tr class="border-t border-line"><td class="py-1">{shortDate(d.date)}</td><td>{d.questions}</td><td>{d.attempts}</td><td>{pct(d.accuracy)}</td></tr>
                {:else}
                  <tr><td colspan="4" class="py-2 text-muted">Chưa ôn ngày nào trong kỳ này.</td></tr>
                {/each}
              </tbody>
            </table>
          </div>
        </details>
      </div>

      <div class="card p-5">
        <h2 class="font-bold">Độ chính xác theo ngày</h2>
        <p class="text-xs text-muted">Ngày không ôn được để trống</p>
        <div class="mt-4">
          <LineChart data={lineData} label="Biểu đồ đường tỉ lệ trả lời đúng theo ngày trong {data.days} ngày" height={220} />
        </div>
        <p class="mt-3 text-xs text-muted">Trung bình cả kỳ: <b class="text-ink">{pct(s.totals.accuracy)}</b></p>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <!-- Theo trình độ / môn -->
      <div class="card p-5">
        <h2 class="font-bold">Theo trình độ / môn</h2>
        {#if s.bySubject.length === 0}
          <p class="mt-3 text-sm text-muted">Chưa có dữ liệu trong kỳ này.</p>
        {:else}
          <ul class="mt-4 space-y-4">
            {#each s.bySubject as sub (sub.subject)}
              <li>
                <div class="flex items-baseline justify-between gap-3 text-sm">
                  <span class="truncate font-semibold">{sub.subject}</span>
                  <span class="shrink-0 tabular-nums"><b>{pct(sub.accuracy)}</b> <span class="text-xs text-muted">· {sub.questions} câu</span></span>
                </div>
                <div class="mt-1.5 h-2" aria-hidden="true">
                  <div class="h-full rounded-full bg-accent" style="width:{Math.max(2, sub.accuracy * 100)}%"></div>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <!-- Đề làm nhiều -->
      <div class="card overflow-hidden">
        <h2 class="px-5 pt-5 font-bold">Đề bạn ôn nhiều nhất</h2>
        {#if s.topQuizzes.length === 0}
          <p class="px-5 pb-5 pt-3 text-sm text-muted">Chưa có dữ liệu trong kỳ này.</p>
        {:else}
          <div class="mt-3 overflow-x-auto">
            <table class="w-full min-w-[480px] text-left text-sm">
              <thead class="text-xs text-muted">
                <tr><th class="px-5 py-2 font-semibold">Đề</th><th class="py-2 font-semibold">Lượt</th><th class="py-2 font-semibold">Đúng TB</th><th class="py-2 font-semibold">Cao nhất</th><th class="py-2 pr-5 font-semibold">Gần nhất</th></tr>
              </thead>
              <tbody class="tabular-nums">
                {#each s.topQuizzes as q (q.quiz_id)}
                  <tr class="border-t border-line">
                    <td class="max-w-[16rem] px-5 py-2.5"><a href="/quiz/{q.quiz_id}" class="block truncate font-semibold hover:text-accent">{q.title}</a></td>
                    <td>{q.attempts}</td>
                    <td>{pct(q.accuracy)}</td>
                    <td>{pct(q.best)}</td>
                    <td class="pr-5">{pct(q.last)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </section>
  {/if}

  <!-- Thành tích -->
  <section>
    <div class="mb-3 flex items-baseline justify-between gap-3">
      <h2 class="flex items-center gap-2 text-lg font-bold"><Trophy size={18} class="text-accent" /> Thành tích</h2>
      <span class="text-sm text-muted">Đã mở khoá {unlocked}/{data.achievements.length}</span>
    </div>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {#each data.achievements as a (a.id)}
        {@const Icon = ICONS[a.icon]}
        <article class="card p-4 {a.level === 0 ? 'opacity-70' : ''}">
          <div class="flex items-start gap-3">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl {TIER_TONE[Math.min(a.level, 4)]}">
              <Icon size={22} />
            </span>
            <div class="min-w-0">
              <p class="font-bold leading-tight">{a.title}</p>
              <p class="mt-0.5 text-[11px] font-semibold text-muted">
                {#if a.level === 0}Chưa mở khoá{:else if a.tiers.length === 1}Đã đạt{:else}Bậc {TIER_NAMES[a.level - 1]}{/if}
              </p>
            </div>
          </div>
          <p class="mt-3 text-xs leading-relaxed text-muted">{a.next === null ? 'Đã đạt bậc cao nhất.' : a.description}</p>
          {#if a.next !== null}
            <div class="mt-2 flex items-center gap-2">
              <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-accent-soft" role="progressbar" aria-valuemin="0" aria-valuemax={a.next} aria-valuenow={a.value} aria-label="Tiến độ {a.title}">
                <div class="h-full rounded-full bg-accent" style="width:{a.progress * 100}%"></div>
              </div>
              <span class="shrink-0 text-[11px] tabular-nums text-faint">{a.value.toLocaleString('vi-VN')}/{a.next.toLocaleString('vi-VN')}</span>
            </div>
          {/if}
        </article>
      {/each}
    </div>
  </section>
</div>
