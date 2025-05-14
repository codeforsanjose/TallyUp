import type { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { client, userPool } from './cognito';
import { buildResponse } from './lib';
import { AuthRequestModel, type RegisterResponse } from './openapi';
import assert from 'node:assert';
import { safeParse } from './lib/safe-parse';

export const builder =
  (client: CognitoIdentityProviderClient, poolClientId: string) =>
  async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
    // Parse
    if (!event.body) return buildResponse(400, { message: 'Request body is required' });
    const parseResult = safeParse(AuthRequestModel, event.body);
    if (!parseResult.success)
      return buildResponse(400, { message: `Invalid request body: ${parseResult.error}` });
    const { email, password } = parseResult.data;

    // Register
    const result = await userPool.beginSignUp({
      client,
      poolClientId,
      Username: email,
      Password: password,
    });
    if (!result.success) {
      console.error('Error registering user:', result.error);
      return buildResponse(400, { message: result.error.message });
    }

    // OK
    return buildResponse<RegisterResponse>(200, result.data);
  };

const poolClientId = process.env['USER_POOL_CLIENT_ID'];
assert(poolClientId, 'USER_POOL_CLIENT_ID is not set');
export const handler = builder(client, poolClientId);
