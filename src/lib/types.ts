export type Result<T> = Success<T> | { success: false; error: Error };

export type Success<T> = T extends void ? { success: true } : { success: true; data: T };

export type User = {
  userId: string;
  email: string;
  status: 'active' | 'suspended' | 'pending';
  role: 'staff' | 'volunteer' | 'admin';
};
