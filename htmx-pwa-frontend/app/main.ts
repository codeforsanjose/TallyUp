import type { Element } from '../lib/types';
import { AuthForm, Dashboard } from './fragments';
import { user } from './idb';

export const Entry: Element = {
  type: 'main',
  behavior: {
    resource: { action: 'get', url: '/page-content' },
    triggers: 'load',
    onTriggered: async (event): Promise<Element> => {
      const authToken = event.request.headers.get('Authorization')?.split('Bearer ')[1];
      if (!authToken) {
        const { authToken } = (await user.get()) || {};
        if (!authToken) {
          return AuthForm('login');
        }

        return Dashboard(authToken);
      }

      return Dashboard(authToken);
    },
    headers: {
      // https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-managed-login.html#view-login-pages
      // @ts-ignore TODO: Really bad hack. Aws wants a redirect after the user logs in. This is for that case.
      Authorization: () => new URLSearchParams(location.search).get('code') || undefined,
    },
  },
};
