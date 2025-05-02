import assert from 'node:assert';
import * as client from '../client';

import type { Element, ElementBehavior, ElementShape, ElementTree } from '../types';

const LoginBehavior: ElementBehavior = {
  resource: { action: 'post', url: '/login' },
  onTriggered: async (event, storage): Promise<ElementTree | Response> => {
    const { cache, cookieStore } = storage;
    const response = await cache.match(event.request);
    if (response) {
      return response;
    }

    assert(Array.isArray(LoginShape.children), 'LoginShape.children is not an array');
    const formData = await event.request.formData(); // OK because it's not multipart/form-data
    const email = formData.get('email')
    const password = formData.get('password');
    if (!email || !password) {
      return {
        type: 'form',
        behavior: LoginBehavior,
        shape: {
          ...LoginShape,
          children: [
            ...(LoginShape.children || []),
            { type: 'p', shape: { children: ['Email and password are required'] } }
          ],
        }
      };
    }

    assert(typeof email === 'string', 'email was malformed');
    assert(typeof password === 'string', 'password was malformed');
    const res = await client.postLogin({
      body: { email, password },
    })
    const { data, error } = res;
    if (error) {
      return {
        type: 'form',
        behavior: LoginBehavior,
        shape: {
          ...LoginShape,
          children: [
            ...(LoginShape.children || []),
            { type: 'p', shape: { children: [error.message] } }
          ],
        }
      }
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/Cookie_Store_API#api.cookiestore
    await cookieStore.set({
      name: 'jwt',
      value: `${data.token}`,
      path: '/',
      sameSite: 'strict',
    });
    return '<p>Login successful!</p>';
  }
}

const LoginShape: ElementShape = {
  children: [
    { type: 'h1', shape: { children: ['Login'] } },
    {
      type: 'input',
      shape: {
        attrs: ['type="email"', 'name="email"', 'placeholder="Email"'],
      },
    },
    {
      type: 'input',
      shape: {
        attrs: ['type="password"', 'name="password"', 'placeholder="Password"'],
      },
    },
    {
      type: 'button',
      shape: { attrs: ['type="submit"'], children: ['Login'] },
    },
  ]
}
export const Login: Element = {
  type: 'form',
  behavior: LoginBehavior,
  shape: LoginShape,
}