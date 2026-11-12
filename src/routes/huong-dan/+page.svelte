<!-- src/routes/huong-dan/+page.svelte -->
<!-- Trung tâm hướng dẫn: soạn đề, nhập file, làm bài, phím tắt, cộng đồng, cài ứng dụng, câu hỏi thường gặp. -->
<script lang="ts">
  import {
    LifeBuoy, PenLine, FileUp, GraduationCap, Keyboard, Users, BarChart3, Smartphone, CircleHelp, Search, ArrowRight
  } from 'lucide-svelte';
  import { matchesQuery } from '$lib/utils/text';

  const toc = [
    { id: 'bat-dau', label: 'Bắt đầu nhanh', icon: LifeBuoy },
    { id: 'cu-phap', label: 'Cú pháp soạn đề', icon: PenLine },
    { id: 'nhap-file', label: 'Nhập từ Word, PDF', icon: FileUp },
    { id: 'lam-bai', label: 'Các cách ôn tập', icon: GraduationCap },
    { id: 'phim-tat', label: 'Phím tắt', icon: Keyboard },
    { id: 'cong-dong', label: 'Cộng đồng', icon: Users },
    { id: 'thong-ke', label: 'Thống kê và mục tiêu', icon: BarChart3 },
    { id: 'cai-dat', label: 'Cài như ứng dụng', icon: Smartphone },
    { id: 'hoi-dap', label: 'Câu hỏi thường gặp', icon: CircleHelp }
  ];

  const syntax = [
    { code: '*A. Hà Nội', desc: 'Dấu * trước đáp án đúng.' },
    { code: '**A. 2', desc: 'Câu nhiều đáp án đúng: dùng ** cho từng đáp án đúng.' },
    { code: 'Đáp án: B', desc: 'Đặt sau các đáp án, thay cho dấu *. Nhiều đáp án: "Đáp án: A, C".' },
    { code: '> Giải thích...', desc: 'Giải thích hiện sau khi trả lời. Cũng nhận "Giải thích: ...".' },
    { code: "'Phần 2: Hình học", desc: 'Dòng bắt đầu bằng dấu nháy đơn mở một phần thi mới.' },
    { code: '(dòng trống)', desc: 'Ngăn cách giữa hai câu hỏi.' },
    { code: 'Câu 1<br />dòng 2', desc: 'Xuống dòng bên trong nội dung câu hỏi.' }
  ];

  const example = `'Phần 1: Địa lý
Thủ đô của Việt Nam là thành phố nào?
A. Huế
*B. Hà Nội
C. Đà Nẵng
D. TP. Hồ Chí Minh
> Hà Nội là thủ đô từ năm 1945.

Chọn các số nguyên tố:
**A. 2
B. 4
**C. 5

'Phần 2: Vật lý
Nước sôi ở bao nhiêu độ C (1 atm)?
A. 90
B. 100
C. 110
Đáp án: B`;

  const shortcuts = [
    { group: 'Mọi trang', rows: [
      { keys: ['Ctrl', 'K'], desc: 'Mở tìm kiếm nhanh (Cmd + K trên Mac)' },
      { keys: ['/'], desc: 'Mở tìm kiếm nhanh khi không gõ chữ ở ô nào' },
      { keys: ['Esc'], desc: 'Đóng hộp thoại, bảng tìm kiếm' }
    ] },
    { group: 'Khi làm bài', rows: [
      { keys: ['A', '...', 'H'], desc: 'Chọn đáp án theo chữ cái' },
      { keys: ['1', '...', '8'], desc: 'Chọn đáp án theo thứ tự' },
      { keys: ['←', '→'], desc: 'Câu trước, câu sau' },
      { keys: ['M'], desc: 'Đánh dấu câu để xem lại' },
      { keys: ['Enter'], desc: 'Kiểm tra (chế độ Học), sang câu tiếp, hoặc nộp bài ở câu cuối' }
    ] },
    { group: 'Thẻ ghi nhớ', rows: [
      { keys: ['Space'], desc: 'Lật thẻ' },
      { keys: ['1'], desc: 'Chưa nhớ (hoặc ←)' },
      { keys: ['2'], desc: 'Đã nhớ (hoặc →)' }
    ] }
  ];

  const faqs = [
    { q: 'HeduQuiz có mất phí không?', a: 'Không. Tạo đề, làm bài, thống kê và mọi tính năng cộng đồng đều miễn phí.' },
    { q: 'Ai xem được đề của tôi?', a: 'Đề Công khai hiện trong Khám phá, trang cá nhân và kết quả tìm kiếm. Đề Riêng tư chỉ bạn thấy. Đổi chế độ bất cứ lúc nào trong trang sửa đề.' },
    { q: 'Sửa đề có làm mất lịch sử làm bài không?', a: 'Không. Câu hỏi giữ nguyên mã khi bạn sửa nội dung, nên lịch sử, câu sai và thống kê vẫn còn. Câu bị xoá sẽ hiện ghi chú "đã bị sửa hoặc xoá" trong bài làm cũ.' },
    { q: 'Tôi lỡ thoát giữa chừng, bài làm có mất không?', a: 'Không. Bài đang làm được lưu trên trình duyệt, lần sau mở đề sẽ có nút Làm tiếp.' },
    { q: 'Ôn câu sai hoạt động thế nào?', a: 'Hệ thống gom những câu mà lần gần nhất bạn trả lời sai, câu sai nhiều lần lên đầu. Lần sau trả lời đúng thì câu đó tự rời khỏi danh sách.' },
    { q: 'File Word nhận đáp án ra sao?', a: 'Đáp án in đậm, gạch chân hoặc có dòng "Đáp án: B" ngay sau các lựa chọn đều được nhận. Nên kiểm tra lại phần xem trước trước khi lưu.' },
    { q: 'PDF quét từ ảnh có nhập được không?', a: 'Chưa. Chỉ PDF có chữ chọn được (copy được) mới đọc được nội dung. Với PDF ảnh, hãy chuyển sang Word hoặc dán văn bản.' },
    { q: 'Mục tiêu hằng ngày tính thế nào?', a: 'Là số câu bạn làm trong ngày theo giờ Việt Nam, cộng dồn qua mọi đề. Đổi mục tiêu trong Thiết lập, từ 5 đến 500 câu.' },
    { q: 'Bộ sưu tập khác Kho đề thế nào?', a: 'Kho đề là đề do bạn tạo. Bộ sưu tập là danh sách bạn tự gom, chứa được cả đề công khai của người khác, có thể để riêng tư hoặc chia sẻ.' },
    { q: 'Làm sao đổi tên hiển thị, ảnh đại diện?', a: 'Vào Thiết lập từ menu tài khoản ở góc phải trên cùng.' }
  ];

  let faqQuery = $state('');
  const filteredFaqs = $derived(faqs.filter(f => matchesQuery(`${f.q} ${f.a}`, faqQuery)));

  let copied = $state(false);
  async function copyExample() {
    try {
      await navigator.clipboard.writeText(example);
      copied = true;
      setTimeout(() => { copied = false; }, 1600);
    } catch {
      // trình duyệt chặn clipboard: người dùng tự bôi đen
    }
  }
</script>

<svelte:head>
  <title>Hướng dẫn sử dụng · HeduQuiz</title>
  <meta name="description" content="Cách soạn đề trắc nghiệm, nhập từ Word/PDF, các chế độ ôn tập, phím tắt và câu hỏi thường gặp trên HeduQuiz." />
</svelte:head>

<div class="grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
  <aside class="hidden lg:block">
    <nav class="sticky top-24 space-y-0.5" aria-label="Mục lục hướng dẫn">
      <p class="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-faint">Mục lục</p>
      {#each toc as t (t.id)}
        <a href="#{t.id}" class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-sunken hover:text-ink">
          <t.icon size={15} /> {t.label}
        </a>
      {/each}
    </nav>
  </aside>

  <div class="min-w-0 space-y-10">
    <header>
      <h1 class="flex items-center gap-2.5 text-3xl font-extrabold tracking-tight"><LifeBuoy size={28} class="text-accent" /> Hướng dẫn sử dụng</h1>
      <p class="mt-2 max-w-[62ch] text-muted">Mọi thứ cần biết để soạn đề nhanh, ôn hiệu quả và chia sẻ với bạn bè.</p>
      <nav class="mt-4 flex flex-wrap gap-2 lg:hidden" aria-label="Mục lục">
        {#each toc as t (t.id)}<a href="#{t.id}" class="chip">{t.label}</a>{/each}
      </nav>
    </header>

    <section id="bat-dau" class="scroll-mt-24">
      <h2 class="text-xl font-bold">Bắt đầu nhanh</h2>
      <ol class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {#each [
          { n: 1, t: 'Tạo đề', d: 'Dán câu hỏi theo cú pháp bên dưới hoặc nhập file Word, PDF.' , href: '/tao-de', cta: 'Soạn đề' },
          { n: 2, t: 'Ôn tập', d: 'Chọn Thi thử hoặc Học, giới hạn giờ, xáo trộn câu và đáp án.', href: '/kham-pha', cta: 'Tìm đề' },
          { n: 3, t: 'Theo dõi tiến bộ', d: 'Xem độ chính xác theo ngày, chuỗi ngày học và thành tích.', href: '/thong-ke', cta: 'Thống kê' }
        ] as s (s.n)}
          <li class="card flex flex-col p-5">
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">{s.n}</span>
            <p class="mt-3 font-semibold">{s.t}</p>
            <p class="mt-1 flex-1 text-sm text-muted">{s.d}</p>
            <a href={s.href} class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">{s.cta} <ArrowRight size={14} /></a>
          </li>
        {/each}
      </ol>
    </section>

    <section id="cu-phap" class="scroll-mt-24">
      <h2 class="text-xl font-bold">Cú pháp soạn đề</h2>
      <p class="mt-1 text-muted">Mỗi câu hỏi là một khối: dòng đầu là nội dung câu, các dòng sau là đáp án có nhãn A. B. C. ...</p>
      <div class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div class="card overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-sunken text-left text-xs uppercase tracking-wide text-muted">
              <tr><th class="px-4 py-2.5 font-semibold">Bạn gõ</th><th class="px-4 py-2.5 font-semibold">Ý nghĩa</th></tr>
            </thead>
            <tbody class="divide-y divide-line">
              {#each syntax as s (s.code)}
                <tr>
                  <td class="whitespace-nowrap px-4 py-3 align-top"><code class="rounded bg-sunken px-1.5 py-0.5 font-mono text-xs">{s.code}</code></td>
                  <td class="px-4 py-3 text-muted">{s.desc}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <div class="card flex flex-col overflow-hidden">
          <div class="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span class="text-xs font-semibold uppercase tracking-wide text-muted">Ví dụ đầy đủ</span>
            <button class="btn btn-ghost btn-sm" onclick={copyExample}>{copied ? 'Đã sao chép' : 'Sao chép'}</button>
          </div>
          <pre class="flex-1 overflow-x-auto bg-sunken/50 p-4 font-mono text-[13px] leading-relaxed">{example}</pre>
          <a href="/tao-de" class="flex items-center justify-center gap-1.5 border-t border-line px-4 py-3 text-sm font-semibold text-accent hover:bg-sunken">
            <PenLine size={15} /> Mở trình soạn đề
          </a>
        </div>
      </div>
    </section>

    <section id="nhap-file" class="scroll-mt-24">
      <h2 class="text-xl font-bold">Nhập từ Word, PDF, TXT</h2>
      <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {#each [
          { t: 'Word (.docx)', d: 'Đáp án in đậm hoặc gạch chân được nhận là đáp án đúng. Đề dùng .doc cũ thì lưu lại thành .docx trước.' },
          { t: 'PDF', d: 'Cần PDF có chữ (copy được). Dòng "Đáp án: B" sau mỗi câu giúp nhận đúng nhất.' },
          { t: 'TXT', d: 'Viết theo cú pháp ở trên, lưu mã UTF-8 để giữ dấu tiếng Việt.' }
        ] as f (f.t)}
          <div class="card p-5">
            <p class="font-semibold">{f.t}</p>
            <p class="mt-1 text-sm text-muted">{f.d}</p>
          </div>
        {/each}
      </div>
      <p class="mt-3 text-sm text-muted">Sau khi nhập, phần xem trước bên phải đánh dấu đỏ những câu thiếu đáp án đúng hoặc chỉ có một lựa chọn để bạn sửa trước khi lưu.</p>
    </section>

    <section id="lam-bai" class="scroll-mt-24">
      <h2 class="text-xl font-bold">Các cách ôn tập</h2>
      <dl class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {#each [
          { t: 'Thi thử', d: 'Làm hết rồi nộp, xem điểm và đáp án sau cùng. Có thể đặt giới hạn thời gian.' },
          { t: 'Học', d: 'Chọn xong thấy ngay đúng sai kèm giải thích, phù hợp khi mới học.' },
          { t: 'Ôn câu sai', d: 'Chỉ làm lại những câu từng trả lời sai, không giới hạn giờ.' },
          { t: 'Thẻ ghi nhớ', d: 'Lật thẻ câu hỏi, tự chấm Đã nhớ hoặc Chưa nhớ, ôn lại thẻ chưa nhớ.' },
          { t: 'Theo phần', d: 'Đề có nhiều phần thì chọn làm riêng từng phần.' },
          { t: 'In hoặc lưu PDF', d: 'In đề có hoặc không kèm đáp án để làm trên giấy.' }
        ] as m (m.t)}
          <div class="card p-5">
            <dt class="font-semibold">{m.t}</dt>
            <dd class="mt-1 text-sm text-muted">{m.d}</dd>
          </div>
        {/each}
      </dl>
    </section>

    <section id="phim-tat" class="scroll-mt-24">
      <h2 class="text-xl font-bold">Phím tắt</h2>
      <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {#each shortcuts as g (g.group)}
          <div class="card p-5">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{g.group}</p>
            <ul class="space-y-2.5">
              {#each g.rows as r (r.desc)}
                <li class="flex items-start justify-between gap-3 text-sm">
                  <span class="text-muted">{r.desc}</span>
                  <span class="flex shrink-0 gap-1">
                    {#each r.keys as k, i (i)}
                      {#if k === '...'}<span class="text-faint">-</span>{:else}<kbd class="min-w-6 rounded-md border border-line border-b-2 bg-surface px-1.5 py-0.5 text-center font-mono text-xs">{k}</kbd>{/if}
                    {/each}
                  </span>
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>
    </section>

    <section id="cong-dong" class="scroll-mt-24">
      <h2 class="text-xl font-bold">Cộng đồng</h2>
      <ul class="mt-4 space-y-3 text-sm">
        {#each [
          { t: 'Theo dõi tác giả', d: 'Đề mới của người bạn theo dõi hiện trong Bảng tin.' },
          { t: 'Thả tim và bình luận', d: 'Đề nhiều tim đứng đầu mục Nhiều tim trong Khám phá. Bình luận để góp ý, hỏi đáp với tác giả.' },
          { t: 'Bộ sưu tập', d: 'Lưu đề vào các danh sách theo chủ đề, để riêng tư hoặc chia sẻ liên kết.' },
          { t: 'Bảng xếp hạng', d: 'Người ôn chăm nhất, tác giả nổi bật và tác giả được theo dõi nhiều, theo tuần, tháng hoặc mọi lúc.' },
          { t: 'Nhân bản đề', d: 'Sao chép đề công khai về Kho đề của bạn để chỉnh sửa theo ý mình.' }
        ] as c (c.t)}
          <li class="card flex gap-4 p-4"><span class="w-40 shrink-0 font-semibold">{c.t}</span><span class="text-muted">{c.d}</span></li>
        {/each}
      </ul>
    </section>

    <section id="thong-ke" class="scroll-mt-24">
      <h2 class="text-xl font-bold">Thống kê và mục tiêu</h2>
      <p class="mt-1 max-w-[70ch] text-muted">
        Trang <a href="/thong-ke" class="font-semibold text-accent hover:underline">Thống kê học tập</a> cho thấy số câu làm mỗi ngày, độ chính xác theo ngày và theo môn,
        các đề bạn ôn nhiều nhất và thành tích đã mở khoá. Đặt mục tiêu số câu mỗi ngày trong
        <a href="/thiet-lap#muc-tieu" class="font-semibold text-accent hover:underline">Thiết lập</a>, vòng tiến độ ở Kho đề sẽ đầy dần khi bạn ôn.
      </p>
    </section>

    <section id="cai-dat" class="scroll-mt-24">
      <h2 class="text-xl font-bold">Cài như ứng dụng</h2>
      <p class="mt-1 text-muted">HeduQuiz cài được lên màn hình chính, mở toàn màn hình như ứng dụng thật.</p>
      <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {#each [
          { t: 'Android (Chrome)', d: 'Bấm menu ba chấm, chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính".' },
          { t: 'iPhone, iPad (Safari)', d: 'Bấm nút Chia sẻ, chọn "Thêm vào MH chính".' },
          { t: 'Máy tính (Chrome, Edge)', d: 'Bấm biểu tượng cài đặt ở cuối thanh địa chỉ.' }
        ] as d (d.t)}
          <div class="card p-5"><p class="font-semibold">{d.t}</p><p class="mt-1 text-sm text-muted">{d.d}</p></div>
        {/each}
      </div>
    </section>

    <section id="hoi-dap" class="scroll-mt-24">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <h2 class="text-xl font-bold">Câu hỏi thường gặp</h2>
        <label class="relative w-full sm:w-64">
          <span class="sr-only">Lọc câu hỏi</span>
          <Search size={15} class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input class="input pl-9" placeholder="Lọc câu hỏi..." bind:value={faqQuery} />
        </label>
      </div>
      <div class="card mt-4 divide-y divide-line overflow-hidden">
        {#each filteredFaqs as f (f.q)}
          <details class="group">
            <summary class="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold hover:bg-sunken/60 [&::-webkit-details-marker]:hidden">
              {f.q}
              <span class="text-lg leading-none text-muted transition group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p class="px-5 pb-5 text-sm leading-relaxed text-muted">{f.a}</p>
          </details>
        {:else}
          <p class="px-5 py-6 text-center text-sm text-muted">Không có câu hỏi nào khớp "{faqQuery}".</p>
        {/each}
      </div>
    </section>
  </div>
</div>
