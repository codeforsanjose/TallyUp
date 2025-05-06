import { Entry } from '../app/main';
import { renderElement } from '../lib';
import type { Action, Element, ElementBehavior } from '../types';

const routes: Record<string, ElementBehavior['onTriggered']> = {};

const registerRoute = (el: Element) => {
  if (typeof el === 'string') return;

  const { behavior } = el;
  if (!behavior) return;
  const { resource, onTriggered } = behavior;
  if (!resource || !onTriggered)
    throw new Error('registerRoute called with missing resource or onTriggered');
  routes[`${resource.action} ${resource.url}`] = onTriggered;

  console.log(`Registered route for ${resource.action} ${resource.url}`);
};

registerRoute(Entry);

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
  const resource = { action: method, url: pathname };
  const onTriggered = routes[`${resource.action} ${resource.url}`];
  if (!onTriggered) {
    event.respondWith(fetch(event.request));
    return;
  }

  for (const [key, value] of request.headers) {
    console.log(`Header: ${key}: ${value}`);
  }

  event.respondWith(
    (async () => {
      try {
        const response = await onTriggered(event);
        if (response instanceof Response) return response;
        return new Response(renderElement(response), {
          headers: { 'Content-Type': 'text/html' },
        });
      } catch (error) {
        console.error(`Error in route handler for ${method} ${pathname}:`, error);
        return new Response('Internal Server Error', { status: 500 });
      }
    })(),
  );
});
