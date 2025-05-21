import {
  type CognitoIdentityProviderClient,
  type SignUpCommandInput,
  InvalidParameterException,
  InvalidPasswordException,
  LimitExceededException,
  SignUpCommand,
  TooManyRequestsException,
  UsernameExistsException,
} from '@aws-sdk/client-cognito-identity-provider';
import type { Result } from '../lib/types';
import type { RegisterResponse } from '../openapi';

// https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow-methods.html#amazon-cognito-user-pools-authentication-flow-methods-password
type BeginSignUpInput = {
  client: CognitoIdentityProviderClient;
  poolClientId: string;
  Username: string;
  Password: string;
};

/** Registers the user in aws cognito with unconfirmed email. An email with a confirmation link will be sent to the user to click on. */
export const beginSignUp = async ({
  client,
  poolClientId,
  Username,
  Password,
}: BeginSignUpInput): Promise<Result<RegisterResponse>> => {
  const input: SignUpCommandInput = {
    ClientId: poolClientId,
    Password, // Cognito validates for us
    Username,
  };
  try {
    const response = await client.send(new SignUpCommand(input));
    const { CodeDeliveryDetails, UserSub } = response;
    if (!CodeDeliveryDetails || !UserSub) {
      return {
        success: false,
        error: new Error(
          `User was created but CodeDeliveryDetails: ${CodeDeliveryDetails} or UserSub: ${UserSub}`,
        ),
      };
    }

    const { Destination } = CodeDeliveryDetails;
    if (!Destination) {
      return {
        success: false,
        error: new Error(
          `User was created but CodeDeliveryDetails.Destination: ${CodeDeliveryDetails.Destination} or CodeDeliveryDetails: ${CodeDeliveryDetails}`,
        ),
      };
    }

    return {
      success: true,
      data: {
        message: `A message with your confirmation link has just been sent to ${Destination}`,
        userId: UserSub,
      },
    };
  } catch (error) {
    if (error instanceof LimitExceededException) {
      throw error; // TODO: It might be worth retrying with exponential backoff
    } else if (
      error instanceof InvalidParameterException ||
      error instanceof InvalidPasswordException ||
      error instanceof TooManyRequestsException ||
      error instanceof UsernameExistsException
    ) {
      return { success: false, error };
    }

    throw error;
  }
};
