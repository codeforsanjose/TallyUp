import { $, component$, useSignal, type Signal } from '@builder.io/qwik';

import { LoginForm, RegisterForm } from './components';

export const App = component$(() => {
  return <AppConsumer />;
});

const AppConsumer = component$(() => {
  const form: Signal<'login' | 'register'> = useSignal('login');
  const darkMode = useSignal(localStorage.getItem('darkMode') === 'true');

  const onFormChange = $(() => {
    form.value = form.value === 'login' ? 'register' : 'login';
  });

  console.log('darkMode:', darkMode.value);
  return (
    <main {...{ 'data-theme': darkMode.value ? 'dark' : 'light' }}>
      <section class='flex h-screen w-screen flex-col items-center justify-center gap-4 bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'>
        {form.value === 'login' ? <LoginForm /> : <RegisterForm />}
        <div class='flex flex-col items-center gap-2'>
          <button type='button' onClick$={onFormChange}>
            {form.value === 'login' ? 'New to Tally Up? Create an account' : 'Login'}
          </button>
          <button
            class='rounded bg-gray-500 p-2'
            onClick$={() => {
              darkMode.value = !darkMode.value;
              localStorage.setItem('darkMode', String(darkMode.value));
            }}
          >
            Toggle Dark Mode
          </button>
        </div>
      </section>
    </main>
  );
});
