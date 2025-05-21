import { $, component$, useSignal } from '@builder.io/qwik';

import { LoginForm, RegisterForm } from './components';

export const App = component$(() => {
  const form = useSignal('login');

  const onFormChange = $(() => {
    form.value = form.value === 'login' ? 'register' : 'login';
  });
  return (
    <>
      {form.value === 'login' ? <LoginForm /> : <RegisterForm />}
      <button class='p-2 bg-blue-500 rounded' onClick$={onFormChange}>
        {form.value === 'login' ? 'Switch to Register' : 'Switch to Login'}
      </button>
    </>
  );
});
