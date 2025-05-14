if ('serviceWorker' in window.navigator) {
  const reg = await window.navigator.serviceWorker.register('/service-worker.js', { scope: '/' });

  reg.addEventListener('updatefound', () => {
    const newWorker = reg.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        console.log('New content is available; please refresh.');
      }
    });
  });
}
