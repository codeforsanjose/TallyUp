import path from 'path';

type FnConfig = {
  srcDir: string;
  outDir: string;
  name: string;
  managedPolicyNames: string[];
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  layers?: {
    argon2?: boolean;
  };
};

export default {
  outDir: {
    web: path.resolve(__dirname, 'dist', 'frontend'),
  },
  functions: [
    {
      srcDir: path.resolve(__dirname, 'src', 'login-function.ts'),
      outDir: path.resolve(__dirname, 'dist', 'build', 'login-function'),
      name: 'loginFunction',
      managedPolicyNames: ['service-role/AWSLambdaBasicExecutionRole', 'SecretsManagerReadWrite'],
      path: '/api/login',
      method: 'POST',
      layers: {
        argon2: true,
      },
    },
    {
      srcDir: path.resolve(__dirname, 'src', 'post-meals-function.ts'),
      outDir: path.resolve(__dirname, 'dist', 'build', 'post-meals-function'),
      name: 'postMealsFunction',
      managedPolicyNames: ['service-role/AWSLambdaBasicExecutionRole', 'SecretsManagerReadWrite'],
      path: '/api/meals',
      method: 'POST',
    },
    {
      srcDir: path.resolve(__dirname, 'src', 'refresh-token-function.ts'),
      outDir: path.resolve(__dirname, 'dist', 'build', 'refresh-token-function'),
      name: 'refreshTokenFunction',
      managedPolicyNames: ['service-role/AWSLambdaBasicExecutionRole', 'SecretsManagerReadWrite'],
      path: '/api/refresh-token',
      method: 'POST',
    },
    {
      srcDir: path.resolve(__dirname, 'src', 'register-function.ts'),
      outDir: path.resolve(__dirname, 'dist', 'build', 'register-function'),
      name: 'registerFunction',
      managedPolicyNames: [
        'service-role/AWSLambdaBasicExecutionRole',
        'SecretsManagerReadWrite',
        'AmazonSESFullAccess',
      ],
      path: '/api/register',
      method: 'POST',
      layers: {
        argon2: true,
      },
    },
    {
      srcDir: path.resolve(__dirname, 'src', 'resend-verification-email-function.ts'),
      outDir: path.resolve(__dirname, 'dist', 'build', 'resend-verification-email-function'),
      name: 'resendVerificationEmailFunction',
      managedPolicyNames: ['service-role/AWSLambdaBasicExecutionRole', 'SecretsManagerReadWrite'],
      path: '/api/resend-verification-email',
      method: 'POST',
    },
    {
      srcDir: path.resolve(__dirname, 'src', 'verify-email-function.ts'),
      outDir: path.resolve(__dirname, 'dist', 'build', 'verify-email-function'),
      name: 'verifyEmailFunction',
      managedPolicyNames: ['service-role/AWSLambdaBasicExecutionRole', 'SecretsManagerReadWrite'],
      path: '/api/verify-email',
      method: 'GET',
    },
  ] as FnConfig[],
};
