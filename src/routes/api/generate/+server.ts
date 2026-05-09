// src/routes/api/generate/+server.ts
import { json, error } from '@sveltejs/kit';
import { GEMINI_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const MAX_QUESTIONS  = 100;
const MAX_B64_LEN    = 14_000_000; // ~10MB decoded
const ALLOWED_MIME   = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

// ── Prompt builders ───────────────────────────────────────────────────

function buildTopicPrompt(p: {
  topic: string; subject?: string; questionCount: number;
  difficulty: string; level?: string; customPrompt?: string | null;
}): string {
  return `You are a Vietnamese quiz creator. Generate a quiz about "${p.topic}"${p.subject ? ` (subject: ${p.subject})` : ''}.

Requirements:
- Exactly ${p.questionCount} questions
- Difficulty: ${p.difficulty}${p.level ? ` (${p.level})` : ''}
- Language: Vietnamese
- Output ONLY the quiz, no extra text, no markdown
${p.customPrompt ? `\nUser instructions: ${p.customPrompt}\n` : ''}
FORMAT (blank line between questions):
Nội dung câu hỏi?
*A. Đáp án đúng
B. Đáp án sai
C. Đáp án sai
D. Đáp án sai

Generate now:`;
}

function buildFilePrompt(p: {
  questionCount: number; difficulty: string; level?: string;
  subject?: string; customPrompt?: string | null;
}): string {
  return `You are a Vietnamese quiz creator. Read the attached document and create a quiz.

Requirements:
- Exactly ${p.questionCount} questions from the document
- Difficulty: ${p.difficulty}${p.level ? ` (${p.level})` : ''}
${p.subject ? `- Subject: ${p.subject}` : ''}
- Language: Vietnamese
- Output ONLY the quiz, no extra text, no markdown
${p.customPrompt ? `\nUser instructions: ${p.customPrompt}\n` : ''}
FORMAT (blank line between questions):
Nội dung câu hỏi?
*A. Đáp án đúng
B. Đáp án sai
C. Đáp án sai
D. Đáp án sai

Generate now:`;
}

// ── Handler ───────────────────────────────────────────────────────────

export const POST: RequestHandler = async ({ request, locals }) => {
  const { session } = await locals.safeGetSession();
  if (!session) throw error(401, 'Unauthorized');

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') throw error(400, 'Invalid JSON');

  const { mode = 'generate' } = body;

  const questionCount = Math.min(Math.max(Number(body.questionCount) || 10, 1), MAX_QUESTIONS);
  const difficulty    = String(body.difficulty ?? 'medium').slice(0, 100);
  const level         = String(body.level ?? '').slice(0, 50);
  const subject       = String(body.subject ?? '').slice(0, 100);
  const customPrompt  = body.customPrompt ? String(body.customPrompt).slice(0, 500) : null;

  try {
    if (mode === 'improve') {
      const rawText = String(body.rawText ?? '').slice(0, 20000);
      if (!rawText) throw error(400, 'Missing rawText');
      const prompt = `Fix this Vietnamese quiz. Keep exact format. Fix grammar/spelling only. No extra text.\n\n${rawText}`;
      const text = await callGemini([{ parts: [{ text: prompt }] }], 0.3);
      return json({ text });

    } else if (mode === 'file') {
      const { fileBase64, mimeType } = body;
      if (!fileBase64 || typeof fileBase64 !== 'string') throw error(400, 'Missing fileBase64');
      if (!ALLOWED_MIME.has(String(mimeType))) throw error(400, 'Chỉ hỗ trợ PDF, DOC, DOCX');
      if (fileBase64.length > MAX_B64_LEN) throw error(400, 'File quá lớn (tối đa 10MB)');

      const prompt  = buildFilePrompt({ questionCount, difficulty, level, subject, customPrompt });
      const contents = [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: String(mimeType), data: fileBase64 } }
        ]
      }];
      const text = await callGemini(contents, 0.5);
      return json({ text });

    } else {
      // mode === 'generate' (từ chủ đề)
      const topic = String(body.topic ?? '').trim().slice(0, 200);
      if (!topic) throw error(400, 'Missing topic');
      const prompt = buildTopicPrompt({ topic, subject, questionCount, difficulty, level, customPrompt });
      const text   = await callGemini([{ parts: [{ text: prompt }] }], 0.7);
      return json({ text });
    }

  } catch (e: unknown) {
    if ((e as { status?: number }).status) throw e;
    throw error(502, e instanceof Error ? e.message : 'Gemini error');
  }
};

async function callGemini(contents: unknown[], temperature: number): Promise<string> {
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { temperature, maxOutputTokens: 8192 }
    })
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Gemini API ${res.status}: ${txt.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Gemini trả về kết quả rỗng');
  return text.trim();
}
