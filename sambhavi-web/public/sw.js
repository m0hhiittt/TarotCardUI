self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data?.text() || "You have a new update." }; }
  const title = data.title || "Shambhavi Tarot";
  const options = {
    body: data.body || "You have a new notification.",
    tag: data.refId ? `${data.target || "update"}-${data.refId}` : "tarot-update",
    renotify: true,
    data: { url: data.url || "/", target: data.target || "", refId: data.refId || null }
  };
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const appIsVisible = windows.some((client) => client.visibilityState === "visible");
    if (!appIsVisible) await self.registration.showNotification(title, options);
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("focus" in client) { await client.focus(); if ("navigate" in client) await client.navigate(url); return; }
    }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});
