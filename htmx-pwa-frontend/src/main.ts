if ('serviceWorker' in window.navigator) {
  const reg = await window.navigator.serviceWorker.register('/service-worker.js', {
    scope: '/',
  });
  const swReadyEvent = new Event('worker-ready');
  if (reg.waiting) {
    window.dispatchEvent(swReadyEvent);
  }

  reg.addEventListener('updatefound', () => {
    const installingWorker = reg.installing;
    if (installingWorker) {
      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // If there's an updated service worker, show a notification
            window.dispatchEvent(swReadyEvent);
          }
        }
      });
    }
  });
}
