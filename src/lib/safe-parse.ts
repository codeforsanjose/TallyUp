import { Schema } from 'zod';

export const safeParse = (schema: Schema, data: string) => {
  try {
    const obj = JSON.parse(data) as unknown;
    const result = schema.safeParse(obj);
    if (!result.success) return { success: false, error: result.error };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: { message: 'Invalid JSON' } };
  }
};
