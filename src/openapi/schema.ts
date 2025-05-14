import { z } from 'zod';

export const AuthRequestModel = z.object({
  email: z
    .string()
    .min(1, 'email is required')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required')
    .regex(
      /^[a-zA-Z0-9!@#$%^&*]{8,}$/,
      'Password must be at least 8 characters long and contain only alphanumeric characters and special characters !@#$%^&*',
    ),
});

export type AuthRequest = z.infer<typeof AuthRequestModel>;

export const BaseResponseModel = z.object({
  message: z.string().min(1, 'message is required'),
});

export type BaseResponse = z.infer<typeof BaseResponseModel>;

export const AuthResponseModel = BaseResponseModel.extend({
  accessToken: z.string().optional(),
  idToken: z.string().optional(),
  refreshToken: z.string().optional(),
});

export type AuthResponse = z.infer<typeof AuthResponseModel>;

export const RegisterResponseModel = BaseResponseModel.extend({
  userId: z.string(),
});

export type RegisterResponse = z.infer<typeof RegisterResponseModel>;
