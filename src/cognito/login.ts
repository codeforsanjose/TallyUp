import {
  type CognitoIdentityProviderClient,
  type InitiateAuthCommandInput,
  InitiateAuthCommand,
  LimitExceededException,
  InvalidParameterException,
  NotAuthorizedException,
  TooManyRequestsException,
  UserNotConfirmedException,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';
import assert from 'node:assert';
import type { Result } from '../lib/types';
import type { AuthResponse } from '../openapi';

type LoginInput = {
  client: CognitoIdentityProviderClient;
  poolClientId: string;
  USERNAME: string;
  PASSWORD: string;
};
export const login = async ({
  client,
  poolClientId,
  USERNAME,
  PASSWORD,
}: LoginInput): Promise<Result<AuthResponse>> => {
  const input: InitiateAuthCommandInput = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: poolClientId,
    AuthParameters: { USERNAME, PASSWORD },
  };

  try {
    const response = await client.send(new InitiateAuthCommand(input));
    if (!response.AuthenticationResult) {
      assert(
        !(response.ChallengeName || response.ChallengeParameters),
        'Signin ChallengeName and ChallengeParameters are enabled, but the code is not implemented',
      );
      throw new Error('AuthenticationResult is undefined for unknown reason');
    }

    const { AccessToken, IdToken, RefreshToken } = response.AuthenticationResult;
    return {
      success: true,
      data: {
        message: 'Login successful',
        accessToken: AccessToken,
        idToken: IdToken,
        refreshToken: RefreshToken,
      },
    };
  } catch (error) {
    if (error instanceof LimitExceededException) {
      throw error; // TODO: It might be worth retrying with exponential backoff
    } else if (
      error instanceof InvalidParameterException ||
      error instanceof NotAuthorizedException ||
      error instanceof TooManyRequestsException ||
      error instanceof UserNotConfirmedException ||
      error instanceof UserNotFoundException
    ) {
      return {
        success: false,
        error,
      };
    }

    throw error;
  }
};
