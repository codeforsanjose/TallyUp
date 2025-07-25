import type { GetSecretValueFn } from '../secrets';

export const buildGetJwtKey = () => {
  let jwtKey: string | undefined;
  return async ({
    jwtSecretArn,
    getSecretValue,
  }: {
    jwtSecretArn: string;
    getSecretValue: GetSecretValueFn;
  }) => {
    if (jwtKey) return jwtKey;
    jwtKey = await getSecretValue({ secretId: jwtSecretArn });
    return jwtKey;
  };
};

export const getJwtKey = buildGetJwtKey();
