import type { APIGatewayProxyEventV2 } from 'aws-lambda';

export const mockApiGatewayEvent = async <T extends string>(
  req: Bun.BunRequest<T>,
): Promise<APIGatewayProxyEventV2> => {
  const body = await req.json();
  const url = new URL(req.url);

  return {
    body,
    headers: Object.fromEntries(req.headers),
    isBase64Encoded: false,
    pathParameters: req.params,
    queryStringParameters: Object.fromEntries(url.searchParams),
    rawPath: url.pathname,
    rawQueryString: url.search,
    version: '2.0',
    requestContext: {
      accountId: 'mockAccountId',
      apiId: 'mockApiId',
      domainName: 'mockDomainName',
      domainPrefix: 'mockDomainPrefix',
      http: {
        method: req.method,
        path: url.pathname,
        protocol: url.protocol.replace(':', ''),
        sourceIp: req.headers.get('X-Forwarded-For') || 'unknown',
        userAgent: req.headers.get('User-Agent') || 'unknown',
      },
      requestId: 'mockRequestId',
      routeKey: `${req.method.toUpperCase()} ${url.pathname}`,
      stage: 'mockStage',
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
    },
    routeKey: `${req.method.toUpperCase()} ${url.pathname}`,
  };
};
