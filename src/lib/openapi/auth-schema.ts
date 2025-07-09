import { z } from 'zod';
import { BaseResponseModel } from './base-response';

export const AuthRequestModel = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .regex(
      /^[a-zA-Z0-9!@#$%^&*]{8,}$/,
      'Password must be at least 8 characters long and contain only alphanumeric characters and special characters !@#$%^&*',
    ),
});

export type AuthRequest = z.infer<typeof AuthRequestModel>;

export const LoginResponseModel = BaseResponseModel.extend({
  refreshToken: z.string(),
  sessionId: z.string(),
});

export type LoginResponse = z.infer<typeof LoginResponseModel>;

export const RegisterResponseModel = BaseResponseModel.extend({
  userId: z.string(),
});

export type RegisterResponse = z.infer<typeof RegisterResponseModel>;
