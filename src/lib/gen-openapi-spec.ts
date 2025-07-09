import {
  extendZodWithOpenApi,
  OpenApiGeneratorV31,
  OpenAPIRegistry,
} from '@asteasolutions/zod-to-openapi';
import { stringify } from 'yaml';
import { z } from 'zod';
import {
  AuthRequestModel,
  BaseResponseModel,
  LoginResponseModel,
  RefreshTokenRequestModel,
  RefreshTokenResponseModel,
  RegisterResponseModel,
  VerifyEmailRequestModel,
  VerifyEmailResponseModel,
} from './openapi';
export const generateOpenApiSpec = async (): Promise<string> => {
  extendZodWithOpenApi(z);

  const registry = new OpenAPIRegistry();

  const OpenApiAuthRequestModel = AuthRequestModel.openapi('AuthRequestModel');
  const OpenApiAuthResponseModel = LoginResponseModel.openapi('LoginResponseModel');
  const OpenApiBaseResponseModel = BaseResponseModel.openapi('BaseResponseModel');
  const OpenApiRegisterResponseModel = RegisterResponseModel.openapi('RegisterResponseModel');

  registry.registerPath({
    method: 'post',
    path: '/login',
    request: {
      body: {
        content: {
          'application/json': {
            schema: OpenApiAuthRequestModel,
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Login successful',
        content: {
          'application/json': {
            schema: OpenApiAuthResponseModel,
          },
        },
      },
      '400': {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: OpenApiBaseResponseModel,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/refresh-token',
    request: {
      body: {
        content: {
          'application/json': {
            schema: RefreshTokenRequestModel.openapi('RefreshTokenRequestModel'),
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Refresh token successful',
        content: {
          'application/json': {
            schema: RefreshTokenResponseModel.openapi('RefreshTokenResponseModel'),
          },
        },
      },
      '400': {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: OpenApiBaseResponseModel,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/register',
    request: {
      body: {
        content: {
          'application/json': {
            schema: OpenApiAuthRequestModel,
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Registration successful',
        content: {
          'application/json': {
            schema: OpenApiRegisterResponseModel,
          },
        },
      },
      '400': {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: OpenApiBaseResponseModel,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/resend-verification-email',
    request: {
      query: z
        .object({
          email: z.string().email('Invalid email format'),
        })
        .openapi('ResendVerificationEmailRequest'),
    },
    responses: {
      '200': {
        description: 'Verification email resent successfully',
        content: {
          'application/json': {
            schema: OpenApiBaseResponseModel,
          },
        },
      },
      '400': {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: OpenApiBaseResponseModel,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/verify-email',
    request: {
      query: VerifyEmailRequestModel.openapi('VerifyEmailRequestModel'),
    },
    responses: {
      '200': {
        description: 'Email verified successfully',
        content: {
          'application/json': {
            schema: VerifyEmailResponseModel.openapi('VerifyEmailResponseModel'),
          },
        },
      },
      '400': {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: OpenApiBaseResponseModel,
          },
        },
      },
    },
  });

  const result = new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Tally Up API',
      version: '0.0.1',
      description: 'Tally Up API',
    },
  });

  return stringify(result);
};
