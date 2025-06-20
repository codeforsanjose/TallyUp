import { Schema } from 'zod';

export const safeParseEventBody = (schema: Schema, data: string) => {
  try {
    const obj = JSON.parse(data) as unknown;
    const result = schema.safeParse(obj);
    if (!result.success) return { success: false, error: result.error };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: new Error('Invalid JSON body') };
  }
};

export const safeParseQueryString = (schema: Schema, queryString: string) => {
  try {
    const params = new URLSearchParams(queryString);
    const obj = Object.fromEntries(params.entries());
    const result = schema.safeParse(obj);
    if (!result.success) return { success: false, error: result.error };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: new Error('Invalid query string') };
  }
};
