import type { User } from '../types';

export type AuthenticatedUser = Omit<User, 'email'>;
