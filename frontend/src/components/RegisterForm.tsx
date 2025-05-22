import { useState, type FormEventHandler } from 'react';

export const RegisterForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.message || 'Unknown error');
    }
    console.log('Register response:', res);
  };

  return (
    <section>
      <form
        action='/api/register'
        method='POST'
        className='flex flex-col gap-4 p-4 rounded shadow-md'
        onSubmit={onSubmit}
      >
        <h2 className='text-xl font-bold'>Register</h2>
        <input
          name='email'
          type='text'
          placeholder='email'
          className='p-2 border rounded'
          onChange={(e) => {
            setEmail((e.target as HTMLInputElement).value);
          }}
        />
        <input
          name='password'
          type='password'
          placeholder='Password'
          className='p-2 border rounded'
          onChange={(e) => {
            setPassword((e.target as HTMLInputElement).value);
          }}
        />
        <button type='submit' className='p-2 bg-blue-500 rounded'>
          Register
        </button>
      </form>
      {error && <p className='text-red-500'>{error}</p>}
    </section>
  );
};
