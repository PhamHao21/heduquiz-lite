// src/service-worker.ts
// Service worker tối giản để HeduQuiz cài được như ứng dụng:
// - JS/CSS đã build và file tĩnh (tên file có hash, không bao giờ cũ) lấy từ cache trước → mở app nhanh hơn.
// - Trang HTML và dữ liệu luôn lấy từ mạng (không cache) để không bao giờ hiện nội dung cũ.
// - Mất mạng khi chuyển trang thì hiện một trang báo offline gọn gàng.
/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `hedu-${version}`;
const ASSETS = new Set([...build, ...files]);

// Chỉ cài sẵn file tĩnh nhỏ (icon, manifest). JS/CSS được lưu dần khi trang thật sự dùng tới,
// để lần đầu vào trang không phải tải cả thư viện đọc PDF / Word nặng vài MB.
sw.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(files)).then(() => sw.skipWaiting()));
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => sw.clients.claim())
  );
});

const OFFLINE_HTML = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mất kết nối · HeduQuiz</title><style>
:root{color-scheme:light dark;--bg:#f7f8fe;--ink:#141529;--muted:#55596f;--brand:#c7d2fe;--on-brand:#1e1b4b}
@media (prefers-color-scheme:dark){:root{--bg:#0d0e18;--ink:#eceef8;--muted:#a8abc4}}
body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;background:var(--bg);color:var(--ink);font-family:system-ui,sans-serif;padding:16px;text-align:center}
h1{font-size:22px;margin:0 0 8px}p{color:var(--muted);margin:0 0 20px;line-height:1.5}
button{font:inherit;font-weight:600;border:0;border-radius:12px;padding:10px 18px;background:var(--brand);color:var(--on-brand);cursor:pointer}
</style></head><body><main><h1>Bạn đang offline</h1><p>Không kết nối được tới HeduQuiz.<br>Kiểm tra mạng rồi thử lại nhé.</p>
<button onclick="location.reload()">Thử lại</button></main></body></html>`;

sw.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== sw.location.origin) return;

  // File build / tĩnh: lấy từ cache trước
  if (ASSETS.has(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(url.pathname);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) cache.put(url.pathname, res.clone());
      return res;
    })());
    return;
  }

  // Chuyển trang: luôn qua mạng, chỉ khi mất mạng mới hiện trang offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => new Response(OFFLINE_HTML, { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } }))
    );
  }
});
