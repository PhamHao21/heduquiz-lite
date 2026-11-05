<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { ArrowRight, FileUp, GraduationCap, Repeat, Share2, Trophy, ClipboardPaste, Target } from 'lucide-svelte';
  import DemoQuestion from '$lib/components/landing/DemoQuestion.svelte';
  import QuizTile from '$lib/components/quiz/QuizTile.svelte';

  const { data } = $props();

  const flow = [
    { icon: ClipboardPaste, title: 'Dán đề hoặc nhập file', text: 'Văn bản, Word, PDF đều được. Đáp án in đậm hay dòng "Đáp án: B" được nhận tự động.' },
    { icon: Target, title: 'Ôn theo cách của bạn', text: 'Thi thử có giờ, hoặc chế độ Học hiện đáp án và giải thích ngay sau mỗi câu.' },
    { icon: Repeat, title: 'Ôn lại đúng chỗ còn sai', text: 'Câu làm sai được gom lại để ôn tiếp, làm đúng thì tự rời khỏi danh sách.' }
  ];
</script>

<svelte:head>
  <title>HeduQuiz · Tạo đề và ôn thi trắc nghiệm</title>
  <meta name="description" content="Tạo đề trắc nghiệm từ văn bản, Word hoặc PDF. Ôn thi, chấm điểm, ôn lại câu sai. Miễn phí." />
</svelte:head>

<!-- Hero -->
<section class="grid items-center gap-10 pt-2 md:grid-cols-[1.1fr_1fr] md:gap-14 md:pt-8">
  <div class="rise-in">
    <h1 class="text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-[56px]">
      Ôn thi trắc nghiệm, theo cách của bạn.
    </h1>
    <p class="mt-5 max-w-[46ch] text-base leading-relaxed text-muted sm:text-lg">
      Dán đề hoặc nhập file Word, PDF. HeduQuiz chấm điểm, nhắc lại câu sai và giúp bạn nhớ lâu hơn.
    </p>
    <div class="mt-8 flex flex-wrap gap-3">
      <a href="/auth" class="btn btn-primary btn-lg">Bắt đầu miễn phí <ArrowRight size={18} /></a>
      <a href="/kham-pha" class="btn btn-secondary btn-lg">Xem đề công khai</a>
    </div>
  </div>
  <div class="rise-in rise-in-delay-2 md:pl-4">
    <DemoQuestion />
  </div>
</section>

<!-- Cách hoạt động -->
<section class="mt-24 grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
  <div class="md:sticky md:top-28 md:self-start">
    <h2 class="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">Từ tài liệu đến bài ôn trong một phút.</h2>
    <p class="mt-4 max-w-[42ch] text-muted">Không cần gõ lại từng câu. Có sẵn đề trong Word là bắt đầu ôn được ngay.</p>
  </div>
  <ol class="space-y-3">
    {#each flow as f (f.title)}
      <li class="card flex gap-4 p-5">
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent"><f.icon size={20} /></span>
        <div>
          <p class="font-bold text-ink">{f.title}</p>
          <p class="mt-1 text-sm leading-relaxed text-muted">{f.text}</p>
        </div>
      </li>
    {/each}
  </ol>
</section>

<!-- Tính năng (bento) -->
<section class="mt-24">
  <h2 class="max-w-xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">Đủ công cụ cho cả mùa ôn thi.</h2>
  <div class="mt-8 grid gap-3 md:grid-cols-3">
    <div class="rounded-2xl bg-accent p-6 text-on-accent md:col-span-2 md:p-8">
      <FileUp size={26} />
      <p class="mt-6 text-xl font-bold">Nhập đề từ Word, PDF</p>
      <p class="mt-2 max-w-md text-sm leading-relaxed opacity-90">
        Tự tách "Câu 1", đáp án nằm chung dòng, nhận đáp án in đậm hoặc gạch chân. File được đọc ngay trên máy bạn.
      </p>
    </div>
    <div class="card p-6">
      <GraduationCap size={24} class="text-accent" />
      <p class="mt-6 font-bold">Chế độ Học</p>
      <p class="mt-1.5 text-sm leading-relaxed text-muted">Chọn xong thấy ngay đúng sai, kèm giải thích.</p>
    </div>
    <div class="rounded-2xl border border-line bg-sunken p-6">
      <Share2 size={24} class="text-accent" />
      <p class="mt-6 font-bold">Chia sẻ một đường link</p>
      <p class="mt-1.5 text-sm leading-relaxed text-muted">Bạn bè ôn được ngay, không cần tài khoản.</p>
    </div>
    <div class="card flex flex-col justify-between gap-6 p-6 md:col-span-2 md:flex-row md:items-end">
      <div>
        <Trophy size={24} class="text-accent" />
        <p class="mt-6 font-bold">Bảng xếp hạng và chuỗi ngày ôn</p>
        <p class="mt-1.5 max-w-md text-sm leading-relaxed text-muted">Theo dõi số câu đã làm mỗi tuần, giữ chuỗi ngày học đều đặn cùng bạn bè.</p>
      </div>
      <a href="/xep-hang" class="btn btn-secondary shrink-0">Xem bảng xếp hạng</a>
    </div>
  </div>
</section>

<!-- Đề công khai phổ biến (dữ liệu thật) -->
{#if data.popular.length > 0}
  <section class="mt-24">
    <div class="flex items-end justify-between gap-4">
      <h2 class="text-2xl font-extrabold tracking-tight sm:text-3xl">Đề được ôn nhiều</h2>
      <a href="/kham-pha" class="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-accent hover:underline">
        Xem tất cả <ArrowRight size={16} />
      </a>
    </div>
    <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {#each data.popular as quiz (quiz.id)}
        <QuizTile {quiz} />
      {/each}
    </div>
  </section>
{/if}

<!-- Kêu gọi cuối trang -->
<section class="mt-24 rounded-2xl border border-line bg-surface px-6 py-12 text-center sm:px-12">
  <h2 class="text-2xl font-extrabold tracking-tight sm:text-3xl">Tạo đề đầu tiên của bạn.</h2>
  <p class="mx-auto mt-3 max-w-md text-muted">Miễn phí, đăng nhập bằng Google trong vài giây.</p>
  <a href="/auth" class="btn btn-primary btn-lg mt-7">Bắt đầu miễn phí <ArrowRight size={18} /></a>
</section>
