import { renderElement, getRoutes } from '..';
import { registerElement } from '../register-element';
import type { Action } from '../types';

// __IMPORT_ENTRY_HERE__
registerElement(`__ENTRY_HERE__`);

// TODO: There are some considerations when force updating the service worker.
self.addEventListener('install', (_) => {
  self.skipWaiting(); // Forces immediate activation
  console.log('Service worker installed');
});

self.addEventListener('activate', (_) => {
  clients.claim(); // Takes control of open pages
  console.log('Service worker activated');
});

self.addEventListener('fetch', async (event: FetchEvent) => {
  const { request } = event;
  const method = request.method.toLowerCase() as Action;
  const pathname = new URL(event.request.url).pathname.toLowerCase();
  const routeKey = `${method} ${pathname}`;
  const onTriggered = getRoutes()[routeKey];
  if (!onTriggered) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const element = await onTriggered(event);
        registerElement(element);
        return new Response(renderElement(element), {
          headers: { 'Content-Type': 'text/html' },
        });
      } catch (error) {
        console.error(`Error in route handler for ${routeKey}:`, error);
        return new Response('Internal Server Error', { status: 500 });
      }
    })(),
  );
});
