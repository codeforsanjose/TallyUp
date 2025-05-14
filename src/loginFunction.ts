import type { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import assert from 'node:assert';
import { client, userPool } from './cognito';
import { buildResponse } from './lib';
import { AuthRequestModel, type AuthResponse } from './openapi';
import { safeParse } from './lib/safe-parse';

export const builder =
  (client: CognitoIdentityProviderClient, env: { poolClientId: string }) =>
  async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
    // Validate
    if (!event.body) return buildResponse(400, { message: 'Request body is required' });
    const parseResult = safeParse(AuthRequestModel, event.body);
    if (!parseResult.success)
      return buildResponse(400, { message: `Invalid request body: ${parseResult.error}` });

    // Try
    const result = await userPool.login({
      client,
      poolClientId: env.poolClientId,
      USERNAME: parseResult.data.email,
      PASSWORD: parseResult.data.password,
    });
    if (!result.success) return buildResponse(400, { message: result.error.message });

    return buildResponse<AuthResponse>(200, result.data);
  };

assert(process.env['USER_POOL_CLIENT_ID'], 'USER_POOL_CLIENT_ID is not set');
export const handler = builder(client, {
  poolClientId: process.env['USER_POOL_CLIENT_ID'],
});
