import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { mockApiGatewayEvent } from './mock-api-gateway-event';

export const asBunHandler = <T extends string>(
  handler: (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2>,
) => {
  return async (req: Bun.BunRequest<T>) => {
    const event = await mockApiGatewayEvent(req);
    const response = await handler(event);
    return new Response(JSON.stringify(response.body), {
      status: response.statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
        ...response.headers,
      },
    });
  };
};
