/**
 * Service Worker Registration — Gowtham Expense Tracker
 *
 * Registers /sw.js in production (process.env.NODE_ENV === 'production').
 * In development, the SW is NOT registered to avoid caching stale hot-reload files.
 *
 * Usage in index.js:
 *   import { registerSW } from './serviceWorkerRegistration';
 *   registerSW();
 */

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(\.\d{1,3}){3}$/)
);

export function registerSW(config) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[SW] Skipping registration in development mode.');
    return;
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service workers are not supported in this browser.');
    return;
  }

  window.addEventListener('load', () => {
    const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

    if (isLocalhost) {
      // Running on localhost — check whether a real SW exists
      checkValidServiceWorker(swUrl, config);
    } else {
      // Production — register normally
      registerValidSW(swUrl, config);
    }
  });
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('[SW] Registered. Scope:', registration.scope);

      registration.onupdatefound = () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.onstatechange = () => {
          if (installing.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content available — old content will be used until tabs are closed
              console.log('[SW] New content available. Refresh to update.');
              if (config?.onUpdate) config.onUpdate(registration);
            } else {
              // Everything pre-cached for offline use
              console.log('[SW] Content is cached for offline use.');
              if (config?.onSuccess) config.onSuccess(registration);
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('[SW] Registration failed:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // SW not found — reload to get a fresh page without SW
        navigator.serviceWorker.ready.then((reg) => reg.unregister()).then(() => {
          window.location.reload();
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('[SW] No internet connection. Running in offline mode.');
    });
}

export function unregisterSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.unregister())
      .catch((error) => console.error('[SW] Unregister failed:', error.message));
  }
}
