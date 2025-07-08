export const getEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    if (process.env.NODE_ENV !== 'development')
      throw new Error(
        `Environment variable ${name} is not set in environment ${process.env.NODE_ENV}`,
      );
    return name;
  }
  return value;
};
