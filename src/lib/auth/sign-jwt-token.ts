import jwt from 'jsonwebtoken';

type GenerateRefreshTokenParams = {
  expiresIn?: jwt.SignOptions['expiresIn'];
  userId: string;
  jwtKey: string;
  [key: string]: any; // Allow additional properties if needed
};

export const signJwtToken = (params: GenerateRefreshTokenParams): string => {
  const { expiresIn, userId, jwtKey: secretKey, ...rest } = params;

  return jwt.sign(
    { userId, ...rest }, // Include userId and any additional properties in the payload
    secretKey,
    { expiresIn: expiresIn || '1y' }, // Set the expiration time for the refresh token
  );
};
