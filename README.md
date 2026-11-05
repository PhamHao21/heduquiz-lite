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

### 🌐 Chia sẻ, khám phá, xếp hạng
- **Chia sẻ đề** bằng link (bảng chia sẻ của điện thoại hoặc copy link), thẻ xem trước khi gửi qua Zalo / Messenger
- **Khám phá** (`/kham-pha`): tìm đề công khai (gõ không dấu được), lọc theo trình độ, sắp xếp phổ biến / mới nhất
- **Xếp hạng** (`/xep-hang`): ôn thi chăm nhất / tạo đề nhiều nhất, theo 7 ngày, 30 ngày hoặc tất cả
- **Trang cá nhân** (`/u/<tên>`): hồ sơ và các đề công khai của mỗi người

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
```

> Chạy lần lượt từng file theo đúng thứ tự. Các file 002–007 chạy lại nhiều lần cũng không sao.

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
│   │   ├── layout/      # Header, BottomNav (điện thoại), Footer, CreateSheet, UserMenu
│   │   ├── ui/          # ConfirmModal, Toaster, Avatar, EmptyState, ThemeToggle
│   │   ├── quiz/        # QuizEngine, Timer, QuizTile
│   │   ├── dashboard/   # ActivityHeatmap
│   │   └── landing/     # DemoQuestion
│   ├── import/          # Đọc Word/PDF/TXT và chuẩn hoá về cú pháp đề
│   ├── stores/          # auth, theme, toast (Svelte 5 runes)
│   ├── supabase/        # client, saveQuiz
│   └── utils/           # parser, attempt, review, activity, exportText, safeRedirect…
├── routes/
│   ├── kho-de/          # Kho đề (bảng điều khiển)
│   ├── tao-de/          # Tạo / sửa đề, nhập file
│   ├── ai-quiz/         # Tạo đề bằng AI (tạm dừng)
│   ├── quiz/[id]/       # Xem đề, ôn thi, kết quả; /in để in và xuất file
│   ├── kham-pha/        # Đề công khai
│   ├── xep-hang/        # Bảng xếp hạng
│   ├── u/[username]/    # Trang cá nhân
│   ├── thiet-lap/       # Thiết lập tài khoản
│   ├── auth/            # Đăng nhập
│   └── api/             # Server endpoints
supabase/migrations/     # 001 → 007, chạy lần lượt trong SQL Editor
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
