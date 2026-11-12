# HEDU. — Nền tảng tạo đề & ôn thi trực tuyến

> Tạo bộ đề từ văn bản thô · Ôn luyện mọi lúc mọi nơi

---

## ✨ Tính năng hiện tại

### 🎨 Giao diện
- Thiết kế lại toàn bộ: font **Be Vietnam Pro** (tự host), hệ màu thống nhất, **giao diện sáng / tối** (theo máy hoặc tự chọn)
- Trên điện thoại có **thanh menu dưới đáy** như ứng dụng; nút "Tạo đề" mở bảng chọn: soạn đề, nhập từ file, AI
- Trang chủ có **câu hỏi mẫu làm được thật** và danh sách đề công khai phổ biến

### 📝 Tạo đề
- Dán văn bản thô, parser tự nhận diện câu hỏi và đáp án; câu một đáp án và nhiều đáp án đúng
- **Nhập từ file Word (.docx) / PDF / TXT** ngay trên trình duyệt: tự bỏ "Câu 1:", tách đáp án chung dòng, nhận đáp án đúng từ chữ **in đậm/gạch chân** hoặc dòng `Đáp án: B`
- Thêm **giải thích** bằng dòng `> ...` (hoặc `Giải thích: ...`) sau các đáp án
- Xem trước từng câu, **danh sách câu lỗi** kèm lý do, nút chèn ví dụ, cảnh báo khi rời trang chưa lưu
- Chia đề thành nhiều **phần** (VD: 200 câu chia 5 phần)

### 🗂️ Kho đề
- Thống kê: số đề, lượt ôn, câu cần ôn, **chuỗi ngày ôn**
- **Lịch hoạt động** 16 tuần (giờ Việt Nam)
- Lọc công khai / riêng tư, sắp xếp, tìm kiếm; bật tắt công khai ngay trên thẻ đề
- Mục **Cần ôn lại** và **Đề đã ôn gần đây** (đề của người khác mở qua link)

### 🎯 Ôn thi
- Chọn phần thi, **đảo câu hỏi / đáp án**, **giới hạn thời gian** (15 đến 90 phút)
- **Thi thử** hoặc **chế độ Học** (chọn xong thấy ngay đúng sai và giải thích)
- **Bảng số câu** để nhảy nhanh, **đánh dấu câu** để xem lại trước khi nộp
- **Tự lưu bài đang làm**: refresh hay lỡ đóng tab vẫn làm tiếp được (kể cả đồng hồ)
- Kết quả: vòng điểm, số câu đúng / sai / bỏ trống, **lọc chi tiết đáp án** theo đúng / sai, kèm giải thích
- Phím tắt: `A-D`/`1-4` chọn đáp án, `← →` chuyển câu, `M` đánh dấu, `Enter` kiểm tra / câu tiếp

### 🔁 Ôn câu sai
- Nộp bài xong bấm **Ôn lại N câu sai** để làm lại ngay các câu vừa sai
- Trang đề hiện **Câu cần ôn lại**: các câu sai ở lần làm gần nhất, kèm số lần sai (cần đăng nhập)
- Ôn lại làm đúng thì câu tự rời khỏi danh sách; sửa đề không làm mất lịch sử của các câu giữ nguyên nội dung

### 💬 Mạng xã hội
- **Theo dõi tác giả**, xem danh sách người theo dõi / đang theo dõi
- **Thả tim** đề hay (đề đã thả tim nằm ở tab **Đã thích** trong Kho đề)
- **Bình luận** dưới mỗi đề (chủ đề xoá được mọi bình luận trong đề của mình)
- **Bảng tin** (`/bang-tin`): đề mới của những người bạn theo dõi, kèm gợi ý tác giả
- **Thông báo** (`/thong-bao`): có người theo dõi, thả tim, bình luận; chuông báo số chưa đọc
- Trang cá nhân có **ảnh bìa**, số người theo dõi, tổng tim, lượt ôn
- Mỗi đề có **ảnh bìa tự sinh** theo màu riêng

### 🧠 Học thêm
- **Thẻ ghi nhớ** (`/quiz/<id>/the-ghi-nho`): lật thẻ xem đáp án, đánh dấu đã nhớ / chưa nhớ, ôn lại thẻ chưa nhớ
- **Lưu bản sao** đề công khai của người khác vào Kho đề để chỉnh sửa
- **Pháo giấy** khi đạt từ 80%, **chia sẻ kết quả** qua tin nhắn

### 🌐 Chia sẻ, khám phá, xếp hạng
- **Chia sẻ đề** bằng link (bảng chia sẻ của điện thoại hoặc copy link), thẻ xem trước khi gửi qua Zalo / Messenger
- **Khám phá** (`/kham-pha`): tìm đề công khai (gõ không dấu được), lọc theo trình độ, sắp xếp phổ biến / nhiều tim / mới nhất, tác giả nổi bật
- **Xếp hạng** (`/xep-hang`): ôn thi chăm nhất / tạo đề nhiều nhất / được theo dõi nhiều, theo 7 ngày, 30 ngày hoặc tất cả
- **Trang cá nhân** (`/u/<tên>`): hồ sơ và các đề công khai của mỗi người

### 📊 Thống kê và mục tiêu
- **Thống kê học tập** (`/thong-ke`): số câu làm mỗi ngày, độ chính xác theo ngày và theo trình độ / môn, đề ôn nhiều nhất, so sánh với kỳ trước (7 / 30 / 90 ngày)
- **Mục tiêu hằng ngày**: chọn số câu mỗi ngày trong Thiết lập, vòng tiến độ ở Kho đề và trang Thống kê
- **Thành tích**: 10 huy hiệu, mỗi cái có các bậc Đồng, Bạc, Vàng, Kim cương
- **Lịch sử làm bài** (`/lich-su`): mọi lần làm, nhóm theo ngày; xem lại từng câu đã chọn, lọc câu sai / đúng (`/lich-su/<id>`)

### 🔖 Bộ sưu tập
- Gom nhiều đề (của mình hoặc đề công khai của người khác) thành **bộ sưu tập**, để riêng tư hoặc công khai
- Nút **Lưu vào bộ sưu tập** ngay trên trang đề, tạo bộ sưu tập mới tại chỗ
- Trang bộ sưu tập (`/bo-suu-tap/<id>`): sửa tên, mô tả, bỏ đề, sao chép liên kết, mở đề ngẫu nhiên
- Tab **Bộ sưu tập** trên trang cá nhân, mục **Bộ sưu tập nổi bật** trong Khám phá

### 🔎 Tìm kiếm và trợ giúp
- **Tìm nhanh** bằng `Ctrl` + `K` (hoặc phím `/`) ở mọi trang: đi tới trang, chạy lệnh, tìm đề / người dùng / bộ sưu tập, dùng hoàn toàn bằng bàn phím
- Trang **Tìm kiếm** (`/tim-kiem`) với các tab Đề, Người dùng, Bộ sưu tập
- **Đang hot tuần này** trong Khám phá: đề được làm nhiều nhất 7 ngày qua
- **Hướng dẫn** (`/huong-dan`): cú pháp soạn đề, nhập file, các cách ôn, phím tắt, câu hỏi thường gặp
- **Cài như ứng dụng** (PWA) trên điện thoại và máy tính, có trang báo khi mất mạng

### 🖨️ In và xuất đề
- Trang in (`/quiz/<id>/in`): đề trắng, đáp án cuối đề hoặc trong từng câu, kèm giải thích, dòng họ tên
- **In / lưu PDF** và **tải file .txt** (nhập lại được vào HeduQuiz)

### 👤 Tài khoản
- Đăng nhập Google (Supabase Auth)
- Trang **Thiết lập**: tên hiển thị, **tên người dùng** (đường dẫn trang cá nhân), giới thiệu, giao diện sáng / tối, đăng xuất

---

## 🚧 Đang phát triển

- **AI tạo đề**: Gemini tự sinh bộ câu hỏi từ chủ đề hoặc file tài liệu *(tạm dừng do giới hạn quota free)*

---

## 🔮 Tính năng tương lai

- [ ] **Nhóm học tập**: tạo lớp, chia sẻ đề trong nhóm
- [ ] **Xuất Word (.docx)**
- [ ] **Ôn tập ngắt quãng** (nhắc ôn lại câu sai theo lịch)

---

## 🛠️ Công nghệ

| Lớp | Công nghệ |
|---|---|
| Framework | [SvelteKit 2](https://kit.svelte.dev) + Svelte 5 (Runes) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Backend / DB | [Supabase](https://supabase.com) (PostgreSQL + Auth + RLS) |
| AI | [Google Gemini](https://ai.google.dev) (mặc định `gemini-2.5-flash`, đổi qua biến `GEMINI_MODEL`) |
| Deploy | [Vercel](https://vercel.com) |
| Icons | [Lucide Svelte](https://lucide.dev) |
| Language | TypeScript |

---

## 🚀 Chạy local

### Yêu cầu
- Node.js ≥ 18
- Tài khoản [Supabase](https://supabase.com) (free tier đủ dùng)
- Gemini API key từ [Google AI Studio](https://aistudio.google.com) *(chỉ cần nếu dùng tính năng AI)*

### 1. Clone & cài đặt

```bash
git clone https://github.com/<your-username>/hedu-quiz.git
cd hedu-quiz
npm install
```

### 2. Tạo file `.env`

```bash
cp .env.example .env
```

Điền các giá trị vào `.env`:

```env
PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
GEMINI_API_KEY=AIza...
```

> Lấy `SUPABASE_URL` và `SUPABASE_PUBLISHABLE_KEY` tại **Project Settings → API** trong Supabase dashboard.

### 3. Chạy migration database

Vào **Supabase → SQL Editor**, paste toàn bộ nội dung file:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_fix_signup_and_play_count.sql
supabase/migrations/003_save_quiz_and_server_grading.sql
supabase/migrations/004_keep_question_ids_on_edit.sql
supabase/migrations/005_save_explanations.sql
supabase/migrations/006_my_quiz_progress.sql
supabase/migrations/007_explore_and_leaderboard.sql
supabase/migrations/008_social.sql
supabase/migrations/009_collections_goals_search.sql
```

> Chạy lần lượt từng file theo đúng thứ tự. Các file 002–009 chạy lại nhiều lần cũng không sao.

### 4. Khởi động

```bash
npm run dev
```

Mở [http://localhost:4050](http://localhost:4050)

---

> **Lưu ý:** tôi đã setting localhost thành 4050 (có thể config lại trong file vite.config.ts)

### 5. Chạy test

```bash
npm test
```

## ☁️ Deploy lên Vercel

1. Push code lên GitHub
2. Import repo vào [Vercel](https://vercel.com/new)
3. Thêm Environment Variables trong Vercel dashboard:

```
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_PUBLISHABLE_KEY
GEMINI_API_KEY
```

4. Deploy — Vercel tự detect SvelteKit và dùng adapter đúng

> **Lưu ý:** Thêm domain Vercel vào **Supabase → Authentication → URL Configuration → Redirect URLs** để OAuth hoạt động.

---

5. Link Website: [https://heduquiz.vercel.app](https://heduquiz.vercel.app/kho-de)

---

## 📁 Cấu trúc thư mục

```
src/
├── app.css              # Design tokens (sáng/tối), font, lớp dùng chung (.card, .btn, .input…)
├── lib/
│   ├── components/
│   │   ├── layout/      # Header, BottomNav (điện thoại), Footer, CreateSheet, UserMenu, CommandPalette (Ctrl+K)
│   │   ├── ui/          # ConfirmModal, Toaster, Avatar, EmptyState, ThemeToggle
│   │   ├── quiz/        # QuizEngine, Timer, QuizTile
│   │   ├── social/      # LikeButton, FollowButton, CommentSection, AuthorCard
│   │   ├── collections/ # CollectionCard, SaveToCollection
│   │   ├── charts/      # ColumnChart, LineChart, GoalRing (SVG tự vẽ)
│   │   ├── dashboard/   # ActivityHeatmap
│   │   └── landing/     # DemoQuestion
│   ├── import/          # Đọc Word/PDF/TXT và chuẩn hoá về cú pháp đề
│   ├── server/          # Truy vấn dùng chung phía server: social, collections, search
│   ├── stores/          # auth, theme, toast, palette (Svelte 5 runes)
│   ├── supabase/        # client, saveQuiz, social, collections
│   └── utils/           # parser, attempt, review, activity, stats, achievements, text, exportText…
├── routes/
│   ├── kho-de/          # Kho đề (bảng điều khiển)
│   ├── tao-de/          # Tạo / sửa đề, nhập file
│   ├── ai-quiz/         # Tạo đề bằng AI (tạm dừng)
│   ├── quiz/[id]/       # Xem đề, ôn thi, kết quả; /in để in và xuất file
│   ├── kham-pha/        # Đề công khai
│   ├── xep-hang/        # Bảng xếp hạng
│   ├── u/[username]/    # Trang cá nhân (đề, người theo dõi, đang theo dõi)
│   ├── bang-tin/        # Bảng tin từ người mình theo dõi
│   ├── thong-bao/       # Thông báo
│   ├── thong-ke/        # Thống kê học tập, thành tích
│   ├── lich-su/         # Lịch sử làm bài và xem lại từng lần
│   ├── bo-suu-tap/      # Bộ sưu tập
│   ├── tim-kiem/        # Kết quả tìm kiếm
│   ├── huong-dan/       # Trung tâm hướng dẫn
│   ├── thiet-lap/       # Thiết lập tài khoản, mục tiêu hằng ngày
│   ├── auth/            # Đăng nhập
│   └── api/             # Server endpoints (attempts, quizzes, profile, search…)
├── service-worker.ts    # PWA: cache file build, trang báo mất mạng
static/                  # favicon, icon PWA, manifest.webmanifest
supabase/migrations/     # 001 → 009, chạy lần lượt trong SQL Editor
```

---

## 🔒 Bảo mật

- **Row Level Security (RLS)** bật trên toàn bộ bảng Supabase
- Mọi API route đều verify session server-side qua `safeGetSession()`
- **Chấm điểm phía server** (`submit_attempt`): client chỉ gửi đáp án đã chọn, không tự gửi điểm
- Lưu đề + câu hỏi trong **một transaction** (`save_quiz`): lỗi giữa chừng không làm mất dữ liệu
- Chặn open redirect ở bước đăng nhập (`safeNext`)
- Dùng `getUser()` thay vì `getSession()` để đảm bảo token được verify với Supabase Auth server
- Biến môi trường nhạy cảm (`GEMINI_API_KEY`) chỉ expose phía server

---

## 📄 License

MIT
