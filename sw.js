// sw.js — Service Worker，支持离线访问与桌面安装
const CACHE_NAME = 'homescreen-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/reset.css',
    '/css/phone.css',
    '/css/widgets.css',
    '/css/apps.css',
    '/css/dock.css',
    '/js/storage.js',
    '/js/grid.js',
    '/js/apps.js',
    '/js/widgets.js',
    '/js/main.js'
];

// 安装：预缓存所有静态资源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// 拦截请求：优先缓存，网络降级
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
});
