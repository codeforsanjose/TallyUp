import type { Element } from '../../types';
import { Dashboard, ErrorPopup } from '.';
import { user } from '../idb';

export const LoginForm: Element = {
  type: 'form',
  behavior: {
    resource: { action: 'post', url: '/login' },
    triggers: 'submit',
    onTriggered: async (event) => {
      const formData = await event.request.formData();
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      if (!email || !password) return ErrorPopup;

      try {
        // TODO: Generate and use api client
        const response = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const clone = response.clone();
          const data = (await clone.json()) as any;
          const authToken = data.authToken;
          await user.set({ authToken, email });
          return Dashboard(authToken);
        }

        try {
          const errorData = (await response.json()) as any;
          throw new Error(errorData.message);
        } catch (error) {
          throw new Error(`Login failed: ${error}`);
        }
      } catch (error) {
        console.error('Error logging in:', error);
        return ErrorPopup;
      }
    },
    swap: 'outerHTML',
  },
  shape: {
    children: [
      { type: 'input', shape: { attrs: ['type=email', 'name=email', 'placeholder=Email'] } },
      {
        type: 'input',
        shape: { attrs: ['type=password', 'name=password', 'placeholder=Password'] },
      },
      { type: 'button', shape: { attrs: ['type=submit'], children: ['Login'] } },
    ],
  },
};
