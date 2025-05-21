import { $, component$, type QRLEventHandlerMulti, useSignal } from '@builder.io/qwik';

export const RegisterForm = component$(() => {
  const email = useSignal('');
  const password = useSignal('');
  const error = useSignal('');

  const onSubmit = $<QRLEventHandlerMulti<SubmitEvent, HTMLFormElement>>(async () => {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      error.value = data.error;
    }
    console.log('Register response:', res);
  });

  return (
    <section>
      <form
        action='/api/register'
        method='POST'
        class='flex flex-col gap-4 p-4 rounded shadow-md'
        onSubmit$={onSubmit}
        preventdefault:submit
      >
        <h2 class='text-xl font-bold'>Register</h2>
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
          Register
        </button>
      </form>
      {error.value && <p class='text-red-500'>{error.value}</p>}
    </section>
  );
});
