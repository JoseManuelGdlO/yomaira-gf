/* MedFlow service worker — Web Push */
self.addEventListener('push', (event) => {
  let data = { title: 'MedFlow', body: 'Nueva notificación', url: '/' };
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { url: data.url ?? '/agenda' },
      tag: 'medflow-appointment',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/agenda';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client && client.url.includes(self.location.origin)) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    }),
  );
});
