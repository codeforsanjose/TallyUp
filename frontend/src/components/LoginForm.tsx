import { $, component$, useSignal, type QRLEventHandlerMulti } from '@builder.io/qwik';
import { client } from '../client';

export const LoginForm = component$(() => {
  const email = useSignal('');
  const password = useSignal('');
  const error = useSignal('');

  const onSubmit = $<QRLEventHandlerMulti<SubmitEvent, HTMLFormElement>>(async () => {
    const res = await client.postLogin({
      email: email.value,
      password: password.value,
    });
    if (!res.ok) {
      error.value = res.error;
    }

    console.log('Login response:', res);
  });
  return (
    <section>
      <form
        onSubmit$={onSubmit}
        preventdefault:submit
        class='flex flex-col gap-4 p-4 rounded shadow-md'
      >
        <h2 class='text-xl font-bold'>Login</h2>
        <input
          name='email'
          type='text'
          placeholder='email'
          class='p-2 border rounded'
          onChange$={(e) => {
            email.value = (e.target as HTMLInputElement).value;
          }}
        />
        <input
          name='password'
          type='password'
          placeholder='Password'
          class='p-2 border rounded'
          onChange$={(e) => {
            password.value = (e.target as HTMLInputElement).value;
          }}
        />
        <button type='submit' class='p-2 bg-blue-500 rounded'>
          Login
        </button>
      </form>
      {error.value && <p class='text-red-500'>{error.value}</p>}
    </section>
  );
});
