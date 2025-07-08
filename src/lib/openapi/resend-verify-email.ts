import { z } from 'zod';
import { BaseResponseModel } from './base-response';

export const ResendVerificationEmailRequestModel = z.object({
  email: z.string().min(1, 'User ID is required'),
});

export const ResendVerificationEmailResponseModel = BaseResponseModel;

export type ResendVerificationEmailRequest = z.infer<typeof ResendVerificationEmailRequestModel>;

export type ResendVerificationEmailResponse = z.infer<typeof ResendVerificationEmailResponseModel>;
