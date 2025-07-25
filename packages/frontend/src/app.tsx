import { $, component$, useSignal, type Signal } from '@builder.io/qwik';

import { AuthFormWrapper } from './components/AuthFormWrapper';
import { Dashboard } from './components/Dashboard';
import type { User } from './types';

export const App = component$(() => {
  return <AppConsumer />;
});

const AppConsumer = component$(() => {
  const form: Signal<'login' | 'register'> = useSignal('login');
  const darkMode = useSignal(localStorage.getItem('darkMode') === 'true');
  const user = useSignal<User>();

  const onFormChange = $(() => {
    form.value = form.value === 'login' ? 'register' : 'login';
  });

  const toggleDarkMode = $(() => {
    darkMode.value = !darkMode.value;
    localStorage.setItem('darkMode', String(darkMode.value));
  });

  return (
    <main {...{ 'data-theme': darkMode.value ? 'dark' : 'light' }}>
      {!user.value ? (
        <AuthFormWrapper form={form} onFormChange={onFormChange} user={user} />
      ) : (
        <Dashboard user={user as Signal<User>} />
      )}
      <button class='rounded bg-gray-500 p-2' onClick$={toggleDarkMode}>
        Toggle Dark Mode
      </button>
    </main>
  );
});
