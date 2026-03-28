/**
 * Service Worker — Gowtham Expense Tracker PWA
 * Strategy: Cache-First for static assets, Network-First for API calls.
 * On install: pre-caches the app shell.
 * On fetch: serves from cache when offline, updates cache in background.
 */

const CACHE_NAME = 'expense-tracker-v1';
const OFFLINE_URL = '/';

// ── App Shell: files to pre-cache on install ──────────────────────────────────
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
];

// ── INSTALL: Pre-cache the app shell ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing…');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(APP_SHELL);
    })
  );
  // Take control immediately without waiting for old SW to die
  self.skipWaiting();
});

// ── ACTIVATE: Clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating…');
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  // Claim all open clients immediately
  self.clients.claim();
});

// ── FETCH: Cache-First for static, Network-First for Supabase ────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and browser-extension requests
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // ── Network-First for Supabase API calls (always want fresh data) ──────────
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a clone of the successful response for offline fallback
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          // Offline: serve cached Supabase response if available
          caches.match(request).then((cached) => cached || Response.error())
        )
    );
    return;
  }

  // ── Cache-First for all other static assets (JS, CSS, images) ──────────────
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Serve from cache, update in background (stale-while-revalidate)
        const networkFetch = fetch(request).then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        });
        // Return cache immediately, don't wait for network
        return cached || networkFetch;
      }

      // Not in cache: fetch from network and cache for next time
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    }).catch(() =>
      // Fully offline and not cached: return the offline shell
      caches.match(OFFLINE_URL)
    )
  );
});
