// service worker pra Web Push (Noronha Delivery)
self.addEventListener("push", (event) => {
  let payload = { title: "Noronha Delivery", body: "Você tem uma notificação", url: "/" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {}

  const options = {
    body: payload.body,
    icon: payload.icon || "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.tag,
    renotify: true,
    requireInteraction: false,
    data: { url: payload.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
