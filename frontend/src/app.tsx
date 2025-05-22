import { useState } from 'react';
import { LoginForm, RegisterForm } from './components';

function App() {
  const [form, setForm] = useState<'login' | 'register'>('login');

  const onFormChange = () => {
    setForm((prev) => (prev === 'login' ? 'register' : 'login'));
  };

  return (
    <div className='App'>
      {form === 'login' ? <LoginForm /> : <RegisterForm />}
      <button className='p-2 bg-blue-500 rounded' onClick={onFormChange}>
        {form === 'login' ? 'Switch to Register' : 'Switch to Login'}
      </button>
    </div>
  );
}

export default App;
