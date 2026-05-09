// src/lib/server/gemini.ts
import { GEMINI_API_KEY } from '$env/static/private';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

export interface GeminiQuizRequest {
  topic: string;
  subject?: string;
  questionCount?: number;
  difficulty?: string;  
  level?: string;
}

export async function generateQuizText(req: GeminiQuizRequest): Promise<string> {
  const { topic, subject = '', questionCount = 10, difficulty = 'medium', level = '' } = req;

  const prompt = `You are a Vietnamese quiz creator. Generate a quiz about "${topic}"${subject ? ` (subject: ${subject})` : ''}.

Requirements:
- Exactly ${questionCount} questions
- Difficulty/level: ${difficulty}${level ? ` (${level})` : ''}
- Language: Vietnamese
- Output ONLY the quiz in the exact format below, no extra text, no markdown, no numbering

FORMAT (use blank line between questions):
Nội dung câu hỏi ở đây?
*A. Đáp án đúng
B. Đáp án sai
C. Đáp án sai
D. Đáp án sai

Generate now:`;

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
    })
  });

  if (!res.ok) throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Gemini returned empty response');
  return text.trim();
}

export async function improveQuizText(rawText: string): Promise<string> {
  const prompt = `Fix and improve this Vietnamese quiz. Keep the same format exactly.
Fix: grammar, spelling, unclear questions.
No extra text or commentary.

INPUT:
${rawText}

OUTPUT:`;

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096 }
    })
  });

  if (!res.ok) throw new Error(`Gemini API error ${res.status}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? rawText;
}
