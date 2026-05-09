# HEDU. — Nền tảng tạo đề & ôn thi trực tuyến

> Tạo bộ đề từ văn bản thô · Ôn luyện mọi lúc mọi nơi

---

## ✨ Tính năng hiện tại

### 📝 Tạo đề thủ công
- Dán văn bản thô, parser tự nhận diện câu hỏi và đáp án
- Hỗ trợ câu một đáp án và nhiều đáp án đúng
- Preview realtime từng câu khi nhập
- Phân chia đề thành nhiều **phần** (VD: 200 câu → 5 phần × 40 câu), đặt tên từng phần

### 🗂️ Kho đề
- Quản lý toàn bộ đề đã tạo
- Tìm kiếm theo tên hoặc môn học

### 🎯 Ôn thi
- Chọn phần thi cụ thể hoặc toàn bộ đề
- Tùy chọn **đảo câu hỏi** và **đảo đáp án**
- **Giới hạn thời gian**: 15 / 30 / 45 / 60 phút hoặc không giới hạn
- Xem kết quả chi tiết từng câu sau khi nộp bài
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

- [ ] **Chia sẻ đề** — link công khai, người khác có thể ôn không cần đăng nhập
- [ ] **Bảng xếp hạng** — hai loại bảng xếp hạng cho người tạo đề nhiều nhât và thi nhiều nhất
- [ ] **Trang khám phá** — có thể xem các đề người khác đăng lên hoặc kênh của họ
- [ ] **Import file trực tiếp** — tự parse từ Word/PDF không cần AI
- [ ] **Export đề** — xuất ra PDF, Word
- [ ] **Nhóm học tập** — tạo lớp, chia sẻ đề trong nhóm

---

## 🛠️ Công nghệ

| Lớp | Công nghệ |
|---|---|
| Framework | [SvelteKit 2](https://kit.svelte.dev) + Svelte 5 (Runes) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Backend / DB | [Supabase](https://supabase.com) (PostgreSQL + Auth + RLS) |
| AI | [Google Gemini 2.0 Flash](https://ai.google.dev) |
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
supabase/migrations/002_add_sections.sql
```

### 4. Khởi động

```bash
npm run dev
```

Mở [http://localhost:4050](http://localhost:5173)

---

## Lưu ý: tôi đã setting localhost thành 4050 (có thể config lại trong file vite.config.json)

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

## 📁 Cấu trúc thư mục

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/          # Button, Card, ConfirmModal...
│   │   ├── quiz/        # QuizEngine, Timer...
│   │   └── Header.svelte, Footer.svelte
│   ├── stores/          # auth.svelte.ts (Svelte 5 runes)
│   ├── supabase/        # client.ts, server.ts
│   └── utils/           # quizParser.ts, shuffle.ts
├── routes/
│   ├── kho-de/          # Danh sách đề
│   ├── tao-de/          # Tạo / sửa đề thủ công
│   ├── ai-quiz/         # Tạo đề bằng AI
│   ├── quiz/[id]/       # Xem đề + ôn thi
│   ├── auth/            # Đăng nhập
│   └── api/             # Server endpoints
└── app.css              # Global styles (Tailwind + custom theme)
```

---

## 🔒 Bảo mật

- **Row Level Security (RLS)** bật trên toàn bộ bảng Supabase
- Mọi API route đều verify session server-side qua `safeGetSession()`
- Dùng `getUser()` thay vì `getSession()` để đảm bảo token được verify với Supabase Auth server
- Biến môi trường nhạy cảm (`GEMINI_API_KEY`) chỉ expose phía server

---

## 📄 License

MIT
