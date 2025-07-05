export type Result<T> = Success<T> | { success: false; error: Error };

export type Success<T> = T extends void ? { success: true } : { success: true; data: T };
