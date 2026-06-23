/**
 * Browser Notification Helper
 * Handles requesting permission and showing native HTML5 notifications
 * with service worker fallback for PWAs/mobile.
 */

export function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function showBuiltinNotification(title, body) {
  if (!('Notification' in window)) return;

  const options = {
    body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
  };

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, options);
    } catch (e) {
      // Fallback for mobile devices (like Android Chrome) that require service worker registration
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, options);
        });
      }
    }
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        try {
          new Notification(title, options);
        } catch (e) {
          if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then((registration) => {
              registration.showNotification(title, options);
            });
          }
        }
      }
    });
  }
}
