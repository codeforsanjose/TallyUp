if ('serviceWorker' in window.navigator) {
  window.navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
}

navigator.serviceWorker.addEventListener('controllerchange', () => {
  console.log('Service worker updated. Reloading page...');
  window.location.reload();
});

export {};
