// src/lib/supabase/saveQuiz.ts
import { supabase } from './client';
import { toQuestionRows, type ParsedQuestion } from '$lib/utils/parser';

export interface SaveQuizInput {
  /** id đề khi sửa; bỏ trống khi tạo mới */
  id?: string | null;
  title: string;
  subject: string | null;
  rawText: string;
  isPublic: boolean;
  sections: unknown[] | null;
  questions: ParsedQuestion[];
}

/**
 * Tạo hoặc sửa đề cùng toàn bộ câu hỏi trong MỘT transaction (RPC save_quiz, migration 003).
 * Lỗi giữa chừng thì không có gì bị thay đổi. Trả về id của đề.
 */
export async function saveQuiz(input: SaveQuizInput): Promise<string> {
  const { data, error } = await supabase.rpc('save_quiz', {
    p_quiz_id: input.id ?? null,
    p_title: input.title.trim(),
    p_subject: input.subject,
    p_raw_text: input.rawText,
    p_is_public: input.isPublic,
    p_sections: input.sections && input.sections.length > 0 ? input.sections : null,
    // Bỏ câu lỗi + đánh lại position 1..n để khớp với phạm vi các phần thi.
    p_questions: toQuestionRows(input.questions)
  });

  if (error) {
    if (error.code === 'PGRST202') {
      throw new Error('Database chưa được cập nhật: hãy chạy migration 003 trên Supabase.');
    }
    throw new Error(error.message);
  }
  return data as string;
}
