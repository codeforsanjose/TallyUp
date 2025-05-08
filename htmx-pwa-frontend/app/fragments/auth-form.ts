import type { Element } from '../../lib';
import { withId } from '../../lib';

export const AuthForm = (state: 'login' | 'register'): Element => {
  const otherState = state === 'login' ? 'register' : 'login';
  return withId((formId) => {
    return {
      type: 'form',
      shape: {
        children: [
          { type: 'input', shape: { attrs: ['type=email', 'name=email', 'placeholder=Email'] } },
          {
            type: 'input',
            shape: { attrs: ['type=password', 'name=password', 'placeholder=Password'] },
          },
          { type: 'button', shape: { attrs: ['type=submit'], children: [state] } },
          {
            type: 'a',
            shape: { children: [otherState] },
            behavior: {
              resource: { action: 'get', url: `/auth-form?${otherState}` },
              swap: 'outerHTML',
              target: `#${formId}`,
              onTriggered: async () => {
                return AuthForm(otherState);
              },
            },
          },
        ],
      },
    };
  });
};
