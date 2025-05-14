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
  },
};
