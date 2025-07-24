type MakeApiRequestParams = {
  path: string;
  options:
    | {
        method: 'GET';
        query: Record<string, string>;
        headers?: Record<string, string>;
        body?: never;
      }
    | {
        method: 'POST' | 'PUT' | 'DELETE';
        body: Record<string, unknown>;
        headers?: Record<string, string>;
        query?: never;
      };
};

export const makeApiRequest = async <T extends Record<string, unknown> | Array<unknown>>(
  params: MakeApiRequestParams,
): Promise<{ status: number; body: T }> => {
  const {
    path,
    options: { body, headers, method, query },
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
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const responseText = await response.text();
  try {
    const responseBody = JSON.parse(responseText);
    return {
      status: response.status,
      body: responseBody as T,
    };
  } catch {
    throw new Error(`Failed to parse response body: ${responseText}`);
  }
};
