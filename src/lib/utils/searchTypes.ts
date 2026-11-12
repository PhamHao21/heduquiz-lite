// src/lib/utils/searchTypes.ts
// Kiểu dữ liệu kết quả tìm kiếm, dùng chung giữa server (/api/search, /tim-kiem) và bảng Ctrl+K.

export interface SearchQuiz {
  id: string; title: string; subject: string | null; play_count: number; like_count?: number | null;
  question_count: number | null; owner_name: string | null; owner_avatar: string | null; owner_username: string | null;
}
export interface SearchPerson {
  id: string; username: string; display_name: string | null; avatar_url: string | null; bio: string | null; follower_count: number | null;
}
export interface SearchCollection {
  id: string; title: string; description: string | null; item_count: number; updated_at: string;
  owner_name: string | null; owner_avatar: string | null; owner_username: string | null;
}
export interface SearchResults {
  quizzes: SearchQuiz[]; quizTotal: number; mine: SearchQuiz[]; people: SearchPerson[]; collections: SearchCollection[];
}
