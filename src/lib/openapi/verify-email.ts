import { z } from 'zod';
import { BaseResponseModel } from './base-response';

export const VerifyEmailRequestModel = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestModel>;

export const VerifyEmailResponseModel = BaseResponseModel.extend({
  userId: z.number(),
  refreshToken: z.string(),
});

export type VerifyEmailResponse = z.infer<typeof VerifyEmailResponseModel>;
