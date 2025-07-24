import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

export const buildResponse = <T extends object>(
  statusCode: number,
  body: T,
  headers?: Record<string, string>,
): APIGatewayProxyStructuredResultV2 => {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
};
