// src/lib/import/extract.ts
// Đọc file Word (.docx), PDF, TXT ngay trên trình duyệt (không gửi file lên server, không cần AI).
// Thư viện đọc file chỉ được tải khi người dùng thực sự import (dynamic import).
import { paragraphsToQuizText, plainTextToParagraphs, type ImportResult, type Paragraph, type Run } from './normalize';

export const IMPORT_ACCEPT = '.docx,.pdf,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,text/plain';
export const MAX_IMPORT_BYTES = 20 * 1024 * 1024;

export class ImportError extends Error {}

function extensionOf(name: string) {
  return name.toLowerCase().split('.').pop() ?? '';
}

/** HTML do mammoth sinh ra → đoạn văn, đánh dấu chữ in đậm (<strong>/<b>) hoặc gạch chân (<u>). */
function htmlToParagraphs(html: string): Paragraph[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks = [...doc.body.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6')]
    // <li> có chứa <p> thì lấy các <p> bên trong, tránh lặp nội dung
    .filter(el => !(el.tagName === 'LI' && el.querySelector('p')));

  return blocks.map(block => {
    const runs: Run[] = [];
    const walker = doc.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? '';
      if (!text) continue;
      const marked = node.parentElement?.closest('strong, b, u');
      runs.push({ text, emphasis: !!marked && block.contains(marked) });
    }
    return runs;
  });
}

async function readDocx(file: File): Promise<Paragraph[]> {
  const mammoth = await import('mammoth');
  const { value: html } = await mammoth.convertToHtml(
    { arrayBuffer: await file.arrayBuffer() },
    // mammoth mặc định bỏ gạch chân → giữ lại thành <u> để nhận đáp án đúng được gạch chân
    { styleMap: ['u => u'] }
  );
  return htmlToParagraphs(html);
}

async function readPdf(file: File): Promise<Paragraph[]> {
  const pdfjs = await import('pdfjs-dist');
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdf = await task.promise;
  const lines: string[] = [];
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();
    let line = '';
    for (const item of content.items) {
      if (!('str' in item)) continue;
      line += item.str;
      if (item.hasEOL) {
        lines.push(line);
        line = '';
      }
    }
    if (line) lines.push(line);
  }
  await task.destroy();
  if (lines.every(l => !l.trim())) {
    throw new ImportError('Không đọc được chữ trong file PDF (có thể là PDF dạng ảnh scan).');
  }
  return lines.map(l => [{ text: l }]);
}

/** Đọc file và chuyển thành văn bản đề theo cú pháp HeduQuiz. */
export async function importQuizFile(file: File): Promise<ImportResult> {
  if (file.size > MAX_IMPORT_BYTES) throw new ImportError('File quá lớn (tối đa 20MB).');
  const ext = extensionOf(file.name);

  let paragraphs: Paragraph[];
  if (ext === 'docx') paragraphs = await readDocx(file);
  else if (ext === 'pdf') paragraphs = await readPdf(file);
  else if (ext === 'txt') paragraphs = plainTextToParagraphs(await file.text());
  else if (ext === 'doc') throw new ImportError('File .doc (Word cũ) chưa hỗ trợ — hãy mở bằng Word và "Lưu thành" .docx.');
  else throw new ImportError('Chỉ hỗ trợ file .docx, .pdf hoặc .txt.');

  const result = paragraphsToQuizText(paragraphs);
  if (!result.text.trim()) throw new ImportError('File không có nội dung chữ.');
  return result;
}
