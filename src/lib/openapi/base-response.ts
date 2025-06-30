import { z } from 'zod';

export const BaseResponseModel = z.object({
  message: z.string().min(1, 'message is required'),
});

export type BaseResponse = z.infer<typeof BaseResponseModel>;
