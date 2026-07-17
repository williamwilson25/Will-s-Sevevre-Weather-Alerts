export async function showNotification(title: string, options: NotificationOptions): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({ type: 'show-notification', title, options });
      return;
    } catch {
      // fall through to the plain constructor below
    }
  }
  if (typeof Notification !== 'undefined') {
    new Notification(title, options);
  }
}
