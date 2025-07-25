export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export type User = {
  email: string;
  refreshToken: string;
  accessToken: string | null;
  lastRefreshed: string;
};
