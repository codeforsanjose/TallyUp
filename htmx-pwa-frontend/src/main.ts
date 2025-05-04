if ('serviceWorker' in window.navigator) {
  const reg = await window.navigator.serviceWorker.register('/service-worker.js', {
    scope: '/',
  });
  if (reg.waiting) {
    window.location.reload();
  }

  reg.addEventListener('updatefound', () => {
    const installingWorker = reg.installing;
    if (installingWorker) {
      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed') {
          window.location.reload();
        }
      });
    }
  });
}
