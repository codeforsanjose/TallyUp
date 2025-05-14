import { z } from 'zod';
import {
  extendZodWithOpenApi,
  OpenApiGeneratorV31,
  OpenAPIRegistry,
} from '@asteasolutions/zod-to-openapi';
import {
  AuthRequestModel,
  AuthResponseModel,
  BaseResponseModel,
  RegisterResponseModel,
} from '../src/openapi';
import { resolve } from 'path';
import { stringify } from 'yaml';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const OpenApiAuthRequestModel = AuthRequestModel.openapi('AuthRequestModel');
const OpenApiAuthResponseModel = AuthResponseModel.openapi('AuthResponseModel');
const OpenApiBaseResponseModel = BaseResponseModel.openapi('BaseResponseModel');
const OpenApiRegisterResponseModel = RegisterResponseModel.openapi('RegisterResponseModel');

registry.registerPath({
  method: 'post',
  path: '/auth/login',
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
  path: '/auth/register',
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

const result = new OpenApiGeneratorV31(registry.definitions).generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'Tally Up API',
    version: '0.0.1',
    description: 'Tally Up API',
  },
});

await Bun.file(resolve(__dirname, '../openapi.yaml')).write(stringify(result));
