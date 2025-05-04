import html from 'html-template-tag';
import type { Element } from '../types';

export const Entry: Element = {
  type: 'main',
  behavior: {
    resource: { action: 'get', url: '/page-content' },
    triggers: 'load',
    onTriggered: async (event): Promise<Element | Response> => {
      const bearer = event.request.headers.get('Authorization');
      if (!bearer) {
        return new Response(
          html`
            <a
              href="https://tallyup-pool.auth.us-west-2.amazoncognito.com/login?client_id=4l3vcqdt5gquj6a91gklltpmce&response_type=code&scope=email+openid&redirect_uri=https%3A%2F%2Fjwt.io"
            >
              Wingo Dingo
            </a>
          `,
          {
            headers: { 'Content-Type': 'text/html' },
          },
        );
      }

      return {
        type: 'div',
        shape: {
          attrs: ['hx-swap="outerHTML"'],
          children: [
            { type: 'h1', shape: { children: ["If you're here, signin worked."] } },
            { type: 'p', shape: { children: ['Yay'] } },
          ],
        },
      };
    },
  },
};
