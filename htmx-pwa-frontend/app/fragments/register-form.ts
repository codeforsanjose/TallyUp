import html from 'html-template-tag';
import { assert } from '../assert';

import { client } from '../client';
import type { Element } from '../../lib';
import { LoginForm } from './login-form';

export const RegisterForm = (error?: string): Element => {
  const errorMessage: Element = error ? html`<p>${error}</p>` : '';
  return {
    type: 'form',
    behavior: {
      resource: { action: 'post', url: '/register' },
      onTriggered: async (event) => {
        const formData = await event.request.formData();
        const email = formData.get('email');
        const password = formData.get('password');
        const passwordConfirmation = formData.get('passwordConfirmation');
        assert(typeof email === 'string', 'Email must be a string');
        assert(typeof password === 'string', 'Password must be a string');
        assert(typeof passwordConfirmation === 'string', 'Password confirmation must be a string');
        if (password !== passwordConfirmation) return RegisterForm(`Passwords do not match`);

        const response = await client.postRegister({ email, password });
        if (!response.success) {
          return RegisterForm(response.error.message);
        }

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
        {
          type: 'input',
          shape: {
            attrs: [
              'type=password',
              'name=passwordConfirmation',
              'placeholder=Password Confirmation',
            ],
          },
        },
        { type: 'button', shape: { attrs: ['type=submit'], children: ['Register'] } },
        {
          type: 'a',
          shape: { children: ['Login'] },
          behavior: {
            resource: { action: 'get', url: '/login' },
            swap: 'outerHTML',
            target: '#register-form',
            onTriggered: async () => {
              return LoginForm();
            },
          },
        },
        errorMessage,
      ],
      id: 'register-form',
    },
  };
};
