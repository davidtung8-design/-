/**
 * sw.js — Service Worker
 * 放置于 public/sw.js
 * 
 * 功能：
 * 1. 缓存核心静态资源（App Shell）
 * 2. 离线时从缓存提供 HTML（App 框架可用）
 * 3. Firebase Firestore 请求不缓存（保持实时）
 */

const CACHE_NAME = 'dt-master-v1';

// 需要预缓存的静态资源
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-512.png',
  '/icon.png',
];

// ────────────────────────────────────────────
// Install: 预缓存核心文件
// ────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // 立刻激活，不等待旧 SW 退出
  self.skipWaiting();
});

// ────────────────────────────────────────────
// Activate: 清理旧缓存
// ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// ────────────────────────────────────────────
// Fetch: 请求拦截策略
// ────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Firebase / API 请求：直接网络，不缓存
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis.com') ||
    url.pathname.startsWith('/api/')
  ) {
    return; // 不拦截，浏览器直接处理
  }

  // 2. 图片/字体：Cache First（先查缓存，没有再网络）
  if (
    event.request.destination === 'image' ||
    event.request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // 3. HTML 导航：Network First（有网用网络，离线用缓存的 /index.html）
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // 4. JS/CSS：Stale While Revalidate（立即返回缓存，后台更新）
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        }).catch(() => cached);

        return cached || networkFetch;
      });
    })
  );
});

// ────────────────────────────────────────────
// Background Sync（可选：离线时队列写入）
// ────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'dt-sync-queue') {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  // 通知所有客户端重新触发 Firestore 写入
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'PROCESS_SYNC_QUEUE' });
  });
}
