// Thin wrapper around the Web Notifications API. This can alert the user
// while the site is open in a background tab, but - like all page JS - it
// stops running once the browser is fully closed. Reaching the user after
// the browser itself is closed would require Web Push (a service worker,
// VAPID keys, and a server-side push send), which is out of scope here.

export function requestNotificationPermission(): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    void Notification.requestPermission();
  }
}

export function showNotification(title: string, body: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  new Notification(title, { body });
}
