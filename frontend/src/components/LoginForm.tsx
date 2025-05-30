import { $, component$, useSignal, type QRLEventHandlerMulti } from '@builder.io/qwik';
import { postLogin } from '../client';
export const LoginForm = component$(() => {
  const email = useSignal('');
  const password = useSignal('');
  const status = useSignal({
    message: '',
    type: 'info' as 'info' | 'success' | 'error',
  });

  const onSubmit = $<QRLEventHandlerMulti<SubmitEvent, HTMLFormElement>>(async () => {
    const res = await postLogin({
      body: {
        email: email.value,
        password: password.value,
      },
    });
    if (res.error) {
      status.value = {
        message: res.error.message || 'Login failed',
        type: 'error',
      };
      console.error('Login error:', res.error);
      return;
    }

    status.value = {
      message: 'Login successful',
      type: 'success',
    };
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
      {status.value.message && (
        <div
          class={`mt-4 p-2 rounded ${
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
