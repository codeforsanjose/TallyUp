import type { APIGatewayProxyEventV2 } from 'aws-lambda';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const mockApiGatewayEvent = (
  eventOverrides: DeepPartial<APIGatewayProxyEventV2> = {},
): APIGatewayProxyEventV2 => {
  return {
    body: eventOverrides.body,
    cookies: eventOverrides.cookies ?? [],
    headers: eventOverrides.headers ?? {},
    isBase64Encoded: eventOverrides.isBase64Encoded ?? false,
    pathParameters: eventOverrides.pathParameters ?? {},
    queryStringParameters: eventOverrides.queryStringParameters ?? {},
    rawPath: eventOverrides.rawPath ?? '/',
    rawQueryString: eventOverrides.rawQueryString ?? '',
    requestContext: {
      accountId: eventOverrides.requestContext?.accountId ?? '123456789012',
      apiId: eventOverrides.requestContext?.apiId ?? 'api-id',
      domainName: eventOverrides.requestContext?.domainName ?? 'example.com',
      domainPrefix: eventOverrides.requestContext?.domainPrefix ?? 'example',
      http: {
        method: eventOverrides.requestContext?.http?.method ?? 'GET',
        path: eventOverrides.requestContext?.http?.path ?? '/',
        protocol: eventOverrides.requestContext?.http?.protocol ?? 'HTTP/1.1',
        sourceIp: eventOverrides.requestContext?.http?.sourceIp ?? '1.1.1.1',
        userAgent: eventOverrides.requestContext?.http?.userAgent ?? 'Mozilla/5.0',
      },
      requestId: eventOverrides.requestContext?.requestId ?? 'request-id',
      routeKey: eventOverrides.requestContext?.routeKey ?? '$default',
      stage: eventOverrides.requestContext?.stage ?? 'prod',
      time: eventOverrides.requestContext?.time ?? '01/Jan/1970:00:00:00 +0000',
      timeEpoch: eventOverrides.requestContext?.timeEpoch ?? 0,
    },
    routeKey: eventOverrides.routeKey ?? '$default',
    stageVariables: eventOverrides.stageVariables ?? {},
    version: eventOverrides.version ?? '2.0',
  };
};
