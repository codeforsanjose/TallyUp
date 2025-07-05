import { z } from 'zod';
import { BaseResponseModel } from './base-response';

export const RefreshTokenRequestModel = z.object({
  refreshToken: z.string(),
  sessionId: z.string(),
});

export const RefreshTokenResponseModel = BaseResponseModel.extend({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestModel>;

export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseModel>;
