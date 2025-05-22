import { useState, type FormEventHandler } from 'react';
import { client } from '../client';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const res = await client.postLogin({
      email: email,
      password: password,
    });

    if (!res.ok) {
      setError(res.error);
    }

    console.log('Login response:', res);
  };

  return (
    <section>
      <form onSubmit={onSubmit} className='flex flex-col gap-4 p-4 rounded shadow-md'>
        <h2 className='text-xl font-bold'>Login</h2>
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
          Login
        </button>
      </form>
      {error && <p className='text-red-500'>{error}</p>}
    </section>
  );
};
