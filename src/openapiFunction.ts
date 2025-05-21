import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { generateOpenApiSpec } from './lib';

export const handler = async (): Promise<APIGatewayProxyStructuredResultV2> => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/yaml',
      'Access-Control-Allow-Origin': '*',
    },
    body: await generateOpenApiSpec(),
  };
};
