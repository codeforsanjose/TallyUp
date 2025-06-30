import jwt from 'jsonwebtoken';

type GenerateRefreshTokenParams = {
  expiresIn?: jwt.SignOptions['expiresIn'];
  userId: number;
  jwtKey: string;
};

export const signJwtToken = (params: GenerateRefreshTokenParams): string => {
  const { expiresIn, userId, jwtKey: secretKey } = params;

  return jwt.sign(
    { userId },
    secretKey,
    { expiresIn: expiresIn || '30d' }, // Set the expiration time for the refresh token
  );
};
