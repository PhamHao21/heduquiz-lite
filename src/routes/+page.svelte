<!-- src/routes/+page.svelte -->
<svelte:head>
  <title>HeduQuiz — Tạo đề · Ôn thi · Ghi nhớ</title>
</svelte:head>

<div class="flex min-h-[85vh] flex-col items-center justify-center px-4 text-center">

  <!-- Hero -->
  <div class="mb-12">
    <p class="mb-3 text-6xl font-black tracking-tighter text-indigo-600 sm:text-7xl">
      HEDU<span class="text-orange-500">.</span>
    </p>
    <h1 class="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
      Tạo đề · Ôn thi · Ghi nhớ
    </h1>
    <p class="mt-3 max-w-sm text-sm text-slate-500 mx-auto">
      Tạo bộ đề từ văn bản thô hoặc để AI tự sinh. Ôn luyện mọi lúc, mọi nơi.
    </p>
    <a href="/auth"
      class="mt-7 inline-block rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 hover:scale-105">
      Bắt đầu miễn phí →
    </a>
  </div>

  <!-- Features -->
  <div class="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
    {#each [
      { icon: '✍️', title: 'Thủ công', desc: 'Dán text, parser tự nhận diện câu hỏi & đáp án ngay lập tức' },
      { icon: '✨', title: 'AI tạo đề', desc: 'Nhập chủ đề, Gemini sinh bộ đề hoàn chỉnh trong vài giây' },
      { icon: '📊', title: 'Theo dõi', desc: 'Xem lịch sử ôn thi, tỉ lệ đúng và tiến độ học tập' }
    ] as f (f.title)}
      <div class="rounded-[2rem] border border-slate-100 bg-white p-5 text-left shadow-sm">
        <span class="text-2xl">{f.icon}</span>
        <p class="mt-2 font-black text-slate-800">{f.title}</p>
        <p class="mt-1 text-xs leading-relaxed text-slate-500">{f.desc}</p>
      </div>
    {/each}
  </div>
</div>
