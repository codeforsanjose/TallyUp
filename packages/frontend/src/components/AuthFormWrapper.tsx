import { component$, type Signal } from '@builder.io/qwik';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import type { User } from '../types';

type FormWrapperProps = {
  form: Signal<'login' | 'register'>;
  onFormChange: () => void;
  user: Signal<User | undefined>;
};

export const AuthFormWrapper = component$((props: FormWrapperProps) => {
  const { form, onFormChange, user } = props;
  return (
    <section class='flex h-screen w-screen flex-col items-center justify-center gap-4 bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'>
      {form.value === 'login' ? <LoginForm user={user} /> : <RegisterForm />}
      <div class='flex flex-col items-center gap-2'>
        <button type='button' onClick$={onFormChange}>
          {form.value === 'login' ? 'New to Tally Up? Create an account' : 'Login'}
        </button>
      </div>
    </section>
  );
});
