import { $, component$, useSignal, type QRLEventHandlerMulti } from '@builder.io/qwik';
import { postLogin } from '../api';
import { PrimaryButton } from './PrimaryButton';
export const LoginForm = component$(() => {
  const email = useSignal('');
  const password = useSignal('');
  const status = useSignal({
    message: '',
    type: 'info' as 'info' | 'success' | 'error',
  });

  const onSubmit = $<QRLEventHandlerMulti<SubmitEvent, HTMLFormElement>>(async () => {
    const res = await postLogin({
      email: email.value,
      password: password.value,
    });

    if (res.status !== 200) {
      status.value = {
        message: res.data.message || 'Login failed',
        type: 'error',
      };
      console.error('Login failed with status:', res.status);
      return;
    }

    status.value = {
      message: 'Login successful',
      type: 'success',
    };
  });
  return (
    <section>
      <form onSubmit$={onSubmit} preventdefault:submit class='flex flex-col gap-4 p-4'>
        <h2 class='text-xl font-bold'>Login</h2>
        <input
          name='email'
          type='text'
          placeholder='email'
          class='rounded border p-2'
          onChange$={(e) => {
            email.value = (e.target as HTMLInputElement).value;
          }}
        />
        <input
          name='password'
          type='password'
          placeholder='Password'
          class='rounded border p-2'
          onChange$={(e) => {
            password.value = (e.target as HTMLInputElement).value;
          }}
        />
        <PrimaryButton type='submit'>Login</PrimaryButton>
      </form>
      {status.value.message && (
        <div
          class={`mt-4 rounded p-2 ${
            status.value.type === 'success'
              ? 'bg-green-100 text-green-800'
              : status.value.type === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
          }`}
        >
          {status.value.message}
        </div>
      )}
    </section>
  );
});
