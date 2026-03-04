self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('notificationclick', (event) => {
  const { tag, title, body, icon } = event.notification;
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // Re-show immediately so the pinned notification stays in the shade
      self.registration.showNotification(title, {
        body,
        icon,
        tag,
        requireInteraction: true,
        silent: true,
      });

      for (const client of list) {
        if (client.url.includes('/app') && 'focus' in client) return client.focus();
      }
      return clients.openWindow('/app');
    })
  );
});
