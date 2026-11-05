# HEDU. — Nền tảng tạo đề & ôn thi trực tuyến

> Tạo bộ đề từ văn bản thô · Ôn luyện mọi lúc mọi nơi

---

## ✨ Tính năng hiện tại

### 📝 Tạo đề thủ công
- Dán văn bản thô, parser tự nhận diện câu hỏi và đáp án
- Hỗ trợ câu một đáp án và nhiều đáp án đúng
- **Nhập từ file Word (.docx) / PDF / TXT** ngay trên trình duyệt: tự bỏ "Câu 1:", tách đáp án chung dòng, nhận đáp án đúng từ chữ **in đậm/gạch chân** hoặc dòng `Đáp án: B`
- Thêm **giải thích** cho câu hỏi bằng dòng `> ...` (hoặc `Giải thích: ...`) đặt sau các đáp án
- Preview realtime từng câu khi nhập
- Phân chia đề thành nhiều **phần** (VD: 200 câu → 5 phần × 40 câu), đặt tên từng phần

### 🗂️ Kho đề
- Số **câu cần ôn** của từng đề và tổng số câu cần ôn
- Mục **Đề đã ôn gần đây**: các đề của người khác bạn đã làm qua link chia sẻ
- Quản lý toàn bộ đề đã tạo
- Tìm kiếm theo tên hoặc môn học

### 🎯 Ôn thi
- Chọn phần thi cụ thể hoặc toàn bộ đề
- Tùy chọn **đảo câu hỏi** và **đảo đáp án**
- **Giới hạn thời gian**: 15 / 30 / 45 / 60 phút hoặc không giới hạn
- Xem kết quả chi tiết từng câu sau khi nộp bài
- **Tự lưu bài đang làm** — refresh hay lỡ đóng tab vẫn làm tiếp được (kể cả đồng hồ đếm giờ)
- Cảnh báo khi nộp bài mà còn câu chưa làm
- **Chế độ Học**: chọn xong thấy ngay đúng/sai kèm giải thích (câu nhiều đáp án bấm "Kiểm tra")
- Phím tắt: `A–D`/`1–4` chọn đáp án, `← →` chuyển câu, `Enter` kiểm tra / câu tiếp

### 🔁 Ôn câu sai
- Nộp bài xong bấm **Ôn lại N câu sai** để làm lại ngay các câu vừa sai
- Trang đề hiển thị **Câu cần ôn lại**: các câu sai ở lần làm gần nhất, kèm số lần sai (cần đăng nhập)
- Ôn lại làm đúng thì câu tự rời khỏi danh sách; sửa đề không làm mất lịch sử của các câu giữ nguyên nội dung
- Lưu lịch sử ôn thi (đăng nhập)

### 👤 Tài khoản
- Đăng nhập qua Google OAuth (Supabase Auth)
- Xem thống kê: số đề đã tạo, tổng lượt ôn

---

## 🚧 Đang phát triển

- **AI tạo đề** — Gemini tự sinh bộ câu hỏi từ chủ đề hoặc file tài liệu (PDF, DOCX) *(tạm dừng do giới hạn quota free)*
- **Trang thiết lập** — chỉnh sửa thông tin cá nhân, avatar

---

## 🔮 Tính năng tương lai

- [x] **Chia sẻ đề** — nút copy link / chia sẻ, đề công khai ôn được không cần đăng nhập
- [ ] **Bảng xếp hạng** — hai loại bảng xếp hạng cho người tạo đề nhiều nhât và thi nhiều nhất
- [ ] **Trang khám phá** — có thể xem các đề người khác đăng lên hoặc kênh của họ
- [x] **Import file trực tiếp** — tự parse từ Word/PDF không cần AI
- [ ] **Export đề** — xuất ra PDF, Word
- [ ] **Nhóm học tập** — tạo lớp, chia sẻ đề trong nhóm

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
```

> Chạy lần lượt từng file theo đúng thứ tự. Các file 002–006 chạy lại nhiều lần cũng không sao.

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
├── lib/
│   ├── components/
│   │   ├── ui/          # Button, Card, ConfirmModal...
│   │   ├── quiz/        # QuizEngine, Timer...
│   │   └── Header.svelte, Footer.svelte
│   ├── stores/          # auth.svelte.ts (Svelte 5 runes)
│   ├── server/          # parser, gemini
│   ├── supabase/        # client.ts, server.ts
│   └── utils/           # quizParser.ts, shuffle.ts
├── routes/
│   ├── kho-de/          # Danh sách đề
│   ├── tao-de/          # Tạo / sửa đề thủ công
│   ├── ai-quiz/         # Tạo đề bằng AI
│   ├── quiz/[id]/       # Xem đề + ôn thi
│   ├── auth/            # Đăng nhập
│   └── api/             # Server endpoints
│   └── thiet-lap/       # Đổi tên và đăng xuất tài khoản
└── app.css              # Global styles (Tailwind + custom theme)
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
