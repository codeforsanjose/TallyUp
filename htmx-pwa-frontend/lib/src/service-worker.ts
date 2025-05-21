import { boilerplate, renderElement } from '..';
import { getRoute } from '../routing';
import type { Action } from '../types';
import { Entry } from 'C:/Users/logan/Documents/github/TallyUp/htmx-pwa-frontend/app/main.ts';

self.addEventListener('install', (event: ExtendableEvent) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', async (event: FetchEvent) => {
  const { request } = event;
  const method = request.method.toLowerCase() as Action;
  const { pathname, search } = new URL(request.url);

  if (method === 'get' && pathname === '/') {
    const file = boilerplate(Entry);
    event.respondWith(
      new Response(file, {
        headers: { 'Content-Type': 'text/html' },
      }),
    );
    return;
  }

  const routeKey = `${method} ${pathname.toLowerCase()}${search}`;
  const onTriggered = getRoute(routeKey);
  if (!onTriggered) {
    console.log(`Forwarding request to network: ${routeKey}`);
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const element = await onTriggered(event);
        console.log(`Rendering element for route: ${routeKey}`, element);
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
