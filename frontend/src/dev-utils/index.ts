import type {
  PostLoginData,
  PostLoginResponse,
  PostRegisterData,
  PostRegisterError,
  PostRegisterResponse,
} from '../client';

// TODO: There are ways to programatically generate this file
//       but for now we will just use this as a placeholder for the dev environment

export const envDEVFetch = async (request: Request): Promise<Response> => {
  const url = 'url' in request ? new URL(request.url) : new URL(request);
  const method = 'method' in request ? request.method : 'GET';

  console.log(`DEV Fetch: ${method} ${url.pathname}${url.search}`);
  if (method === 'POST') {
    const data = await request.json();
    if (url.pathname === '/api/login') {
      const response = fakeLogin(data);
      return new Response(JSON.stringify(response), {
        status: response.statusCode,
        headers: { 'Content-Type': 'application/json' },
      });
    } else if (url.pathname === '/api/register') {
      const response = fakeRegister(data);
      return new Response(JSON.stringify(response), {
        status: response.statusCode,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ message: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
};

const fakeLogin = (
  data: NonNullable<PostLoginData['body']>,
): (PostRegisterError | PostLoginResponse) & {
  statusCode: number;
} => {
  console.log('Fake login data:', data);
  const user = fakeUsers.find(
    (user) => user.email === data.email && user.password === data.password,
  );

  if (!user) {
    return {
      message: 'Invalid email or password',
      statusCode: 401,
    };
  }

  return {
    message: 'Login successful',
    accessToken: 'fakeAccessToken',
    idToken: 'fakeIdToken',
    refreshToken: 'fakeRefreshToken',
    statusCode: 200,
  };
};

const fakeRegister = (
  data: NonNullable<PostRegisterData['body']>,
): (PostRegisterError | PostRegisterResponse) & {
  statusCode: number;
} => {
  const user = fakeUsers.find((user) => user.email === data.email);

  if (user) {
    return {
      message: 'User already exists',
      statusCode: 400,
    };
  }

  fakeUsers.push({
    email: data.email || '',
    password: data.password || '',
  });

  return {
    message: 'Registration successful',
    statusCode: 200,
  };
};

const fakeUsers = [
  {
    email: 'test@email.com',
    password: 'P@ssword123!',
  },
];
