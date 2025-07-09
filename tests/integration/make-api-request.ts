type MakeApiRequestParams = {
  path: string;
  options:
    | {
        method: 'GET';
        query: Record<string, string>;
        body?: never;
      }
    | {
        method: 'POST' | 'PUT' | 'DELETE';
        body: Record<string, unknown>;
        query?: never;
      };
};

export const makeApiRequest = async <T extends Record<string, unknown> | Array<unknown>>(
  params: MakeApiRequestParams,
): Promise<{ status: number; body: T }> => {
  const {
    path,
    options: { body, method, query },
  } = params;

  const url = new URL(`http://localhost:3000${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const responseBody = await response.json();

  return {
    status: response.status,
    body: responseBody,
  };
};
