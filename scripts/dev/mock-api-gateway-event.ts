import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { Request } from 'express';

export const mockApiGatewayEvent = (req: Request): APIGatewayProxyEventV2 => {
  const body = (req.body as Buffer)?.toString('utf-8');

  console.log(req.query);

  return {
    body,
    headers: req.headers as Record<string, string>,
    isBase64Encoded: false,
    pathParameters: req.params,
    queryStringParameters: req.query as Record<string, string>,
    rawPath: req.path,
    rawQueryString: new URLSearchParams(req.query as Record<string, string>).toString(),
    version: '2.0',
    requestContext: {
      accountId: 'mockAccountId',
      apiId: 'mockApiId',
      domainName: 'mockDomainName',
      domainPrefix: 'mockDomainPrefix',
      http: {
        method: req.method,
        path: req.path,
        protocol: req.protocol,
        sourceIp: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
      },
      requestId: 'mockRequestId',
      routeKey: `${req.method.toUpperCase()} ${req.path}`,
      stage: 'mockStage',
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
    },
    routeKey: `${req.method.toUpperCase()} ${req.path}`,
  };
};
