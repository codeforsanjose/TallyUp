import { Login } from "../fragments";
import type { Element } from "../types";

export const Entry: Element = {
  type: 'main',
  behavior: {
    resource: { action: 'get', url: '/page-content' },
    triggers: 'load',
    onTriggered: async (event): Promise<Element | Response> => {
      const bearer = event.request.headers.get('Authorization');
      if (!bearer) {
        return Login;
      }

      return {
        type: 'div',
        shape: {
          attrs: ['hx-swap="outerHTML"'],
          children: [
            { type: 'h1', shape: { children: ['What'] } },
            { type: 'p', shape: { children: ['How are you here?'] } },
          ],
        },
      };
    },
  }
};