/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

precacheAndRoute(self.__WB_MANIFEST);

// Never intercept OAuth broker paths — they must always hit the network
// so the state cookie handshake on oauth.lovable.app works correctly.
self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/~oauth')) {
    event.respondWith(fetch(event.request));
  }
});

self.addEventListener('push', (event: PushEvent) => {
  const data = (() => {
    try { return event.data?.json() ?? {}; } catch { return { title: event.data?.text() ?? 'Notification' }; }
  })();
  const title = data.title || 'Cnergise';
  const options: NotificationOptions = {
    body: data.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: { url: data.url || '/' },
    tag: data.tag,
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const url = (event.notification.data as any)?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ('focus' in c) { (c as WindowClient).navigate(url); return (c as WindowClient).focus(); }
      }
      return self.clients.openWindow(url);
    })
  );
});
