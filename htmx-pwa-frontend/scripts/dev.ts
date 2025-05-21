import { build } from '../';

const server = Bun.serve({
  port: 3000,
  fetch: async (request, _) => {
    const { pathname } = new URL(request.url);
    console.log(`Request for ${pathname}`);
    const { html, serviceWorker, mainJs } = await build();

    if (pathname === '/service-worker.js') {
      return new Response(serviceWorker, {
        headers: { 'Content-Type': 'application/javascript' },
      });
    } else if (pathname === '/') {
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    } else if (pathname === '/main.js') {
      return new Response(mainJs, {
        headers: { 'Content-Type': 'application/javascript' },
      });
    }
    return new Response('Not Found', { status: 404, statusText: 'Not Found' });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
