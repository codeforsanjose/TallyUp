import html from 'html-template-tag';
import type { Element } from '../../lib';
import { client } from '../client';
import { RegisterForm } from './register-form';

export const LoginForm = (error?: string): Element => {
  const errorMessage: Element = error ? html`<p>${error}</p>` : '';

  return {
    type: 'form',
    behavior: {
      resource: { action: 'post', url: '/login' },
      onTriggered: async (event) => {
        const formData = await event.request.formData();
        const email = formData.get('email');
        const password = formData.get('password');
        if (!email || !password || typeof email !== 'string' || typeof password !== 'string')
          return LoginForm(`Something was missing: ${email}, ${password}`);

        const response = await client.postLogin({ email, password });
        if (!response.success) return LoginForm(response.error.message);

        return html`<div>
          <h1>Response</h1>
          <p>${JSON.stringify(response.data)}</p>
          <p>Please refresh to try the other function.</p>
        </div>`;
      },
    },
    shape: {
      children: [
        { type: 'input', shape: { attrs: ['type=email', 'name=email', 'placeholder=Email'] } },
        {
          type: 'input',
          shape: { attrs: ['type=password', 'name=password', 'placeholder=Password'] },
        },
        { type: 'button', shape: { attrs: ['type=submit'], children: ['Login'] } },
        {
          type: 'a',
          shape: { children: ['Register'] },
          behavior: {
            resource: { action: 'get', url: '/register' },
            swap: 'outerHTML',
            target: '#login-form',
            onTriggered: async () => {
              return RegisterForm();
            },
          },
        },
        errorMessage,
      ],
      id: 'login-form',
    },
  };
};
