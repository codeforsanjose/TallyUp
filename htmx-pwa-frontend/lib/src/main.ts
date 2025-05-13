if ('serviceWorker' in window.navigator) {
  const reg = await window.navigator.serviceWorker.register('/service-worker.js', { scope: '/' });

  reg.addEventListener('updatefound', () => {
    if (reg.installing) {
      reg.installing.addEventListener('statechange', () => {
        if (reg.active) window.location.reload();
      });
    }
  });
}
