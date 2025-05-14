import type { Element } from '../../lib';
import { withId } from '../../lib';

export const AuthForm = (state: 'login' | 'register'): Element => {
  const otherState = state === 'login' ? 'register' : 'login';
  return withId((formId) => {
    return {
      type: 'form',
      behavior: {
        // triggers: 'submit' (uneeded because it's a form, but I wonder if it's worth enforcing anyway in the future for clarity)
        resource: { action: 'post', url: `/${state}` },
        swap: 'none',
        onTriggered: async (event) => {},
      },
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
