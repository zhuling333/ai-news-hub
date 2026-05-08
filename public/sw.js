// sw.js - AI 前线资讯 Service Worker v1.0
const CACHE = 'ai-news-hub-v1';
const STATIC_URLS = [
  '/',
  '/index.html',
  '/js/app.js',
  '/public/favicon.svg',
  '/public/manifest.json',
];

// 安装：预缓存静态资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC_URLS))
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 策略：网络优先，缓存后备（数据保持新鲜）
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 仅处理同源请求
  if (url.origin !== location.origin) return;

  // JSON 数据：网络优先，缓存后备
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 其他：缓存优先（静态资源）
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
