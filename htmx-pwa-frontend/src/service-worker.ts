import { Entry } from '../app/main';
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

// TODO: There are some considerations when force updating the service worker.
self.addEventListener('install', (_) => {
  registerRoute(Entry);
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

  console.log(`Request for ${pathname} with method ${method}`);
  console.log(`Event: ${JSON.stringify(event.request, null, 2)}`);

  const resource = { action: method, url: pathname };
  const onTriggered = routes[`${resource.action} ${resource.url}`];
  if (!onTriggered) {
    console.log(`No route found for ${method} ${pathname}`);
    return;
  }

  console.log(`Found route for ${pathname}`);
  event.respondWith(
    (async () => {
      const response = await onTriggered(event, {} as any); // TODO: Doesn't use storage for now
      if (response instanceof Response) return response;
      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'text/html' },
      });
    })(),
  );
});
